import { createHash, randomBytes } from "node:crypto";
import type { UserProfileServiceApi } from "../../users/service/user-profile-service.type.js";
import type { TransactionManager } from "../../../shared/database/transaction-manager.js";
import { randomUUIDv7 } from "../../../shared/uuid/uuid-v7.js";
import { AuthValidationError } from "../errors/auth.error.js";
import type { AuthCredentialRepository } from "../repository/auth-credential-repository.type.js";
import type { AuthSessionRepository } from "../repository/auth-session-repository.type.js";
import type { AuthServiceApi } from "./auth-service.type.js";
import type { PasswordHasher } from "../security/password-hasher.type.js";
import type { AuthSession, AuthSessionTokens } from "../types/auth-session.type.js";
import type { AuthTokenResponse } from "../types/auth-token-response.type.js";
import type { LoginCommand, RegisterUserCommand } from "../types/auth-command.type.js";
import { ApplicationError } from "../../../shared/errors/application-error.js";
import type { Environment } from "../../../config/environment.type.js";
import type { RoleServiceApi } from "../../roles/service/role-service.type.js";

const DUMMY_PASSWORD = "invalid-login-dummy-password";
const CURRENT_PASSWORD_ERROR = () =>
  new AuthValidationError("current_password", "current_password_invalid");
type IssuedTokens = {
  values: AuthSessionTokens;
  accessToken: string;
  refreshToken: string;
};

export class AuthService implements AuthServiceApi {
  constructor(
    private readonly userService: UserProfileServiceApi,
    private readonly roleService: RoleServiceApi,
    private readonly authCredentialRepository: AuthCredentialRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly transactionManager: TransactionManager,
    private readonly passwordHasher: PasswordHasher,
    private readonly environment: Environment,
  ) {}

  async register(input: RegisterUserCommand): Promise<{ id: string }> {
    const passwordHash = await this.passwordHasher.hash(input.password);
    return this.transactionManager.run(async (transaction) => {
      const user = await this.userService.create(
        {
          roleId: await this.roleService.getDefaultRoleId(transaction),
          name: input.name,
          email: input.email,
          phone_number: input.phone_number,
          country_code: input.country_code,
        },
        transaction,
      );
      await this.authCredentialRepository.create(user.id, passwordHash, transaction);
      return { id: user.id };
    });
  }

  async login(input: LoginCommand): Promise<AuthTokenResponse> {
    const user = await this.userService.findByEmail(input.email);
    const passwordHash = user
      ? await this.authCredentialRepository.findPasswordHashByUserId(user.id)
      : null;
    if (!user || !passwordHash) {
      await this.passwordHasher.hash(DUMMY_PASSWORD);
      throw new AuthValidationError("credentials", "credentials_invalid");
    }
    if (!(await this.passwordHasher.verify(passwordHash, input.password)))
      throw new AuthValidationError("credentials", "credentials_invalid");

    const issued = this.createSession(user.id, input.remember_me);
    await this.transactionManager.run(async (transaction) => {
      const currentPasswordHash =
        await this.authCredentialRepository.findPasswordHashByUserIdForUpdate(user.id, transaction);
      if (
        currentPasswordHash !== passwordHash ||
        !(await this.userService.findById(user.id, transaction))
      )
        throw new AuthValidationError("credentials", "credentials_invalid");
      await this.authSessionRepository.create(issued.session, transaction);
    });
    return issued.response;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const currentPasswordHash = await this.getVerifiedPasswordHash(userId, currentPassword);
    const nextPasswordHash = await this.passwordHasher.hash(newPassword);
    await this.transactionManager.run(async (transaction) => {
      const lockedPasswordHash =
        await this.authCredentialRepository.findPasswordHashByUserIdForUpdate(userId, transaction);
      if (lockedPasswordHash !== currentPasswordHash) throw CURRENT_PASSWORD_ERROR();
      if (!(await this.userService.findById(userId, transaction)))
        throw new ApplicationError("not_found");
      if (
        !(await this.authCredentialRepository.updatePasswordHash(
          userId,
          nextPasswordHash,
          transaction,
        ))
      )
        throw CURRENT_PASSWORD_ERROR();
      await this.authSessionRepository.revokeAllByUserId(userId, new Date(), transaction);
    });
  }

  async deactivateAccount(userId: string, currentPassword: string): Promise<void> {
    const currentPasswordHash = await this.getVerifiedPasswordHash(userId, currentPassword);
    await this.transactionManager.run(async (transaction) => {
      const lockedPasswordHash =
        await this.authCredentialRepository.findPasswordHashByUserIdForUpdate(userId, transaction);
      if (lockedPasswordHash !== currentPasswordHash) throw CURRENT_PASSWORD_ERROR();
      if (!(await this.userService.findById(userId, transaction)))
        throw new ApplicationError("not_found");
      await this.userService.softDelete(userId, transaction);
      await this.authCredentialRepository.softDeleteByUserId(userId, transaction);
      await this.authSessionRepository.revokeAllByUserId(userId, new Date(), transaction);
    });
  }

  async deactivateAccountByAdministrator(userId: string): Promise<void> {
    await this.transactionManager.run(async (transaction) => {
      const passwordHash = await this.authCredentialRepository.findPasswordHashByUserIdForUpdate(
        userId,
        transaction,
      );
      if (!(await this.userService.findById(userId, transaction)))
        throw new ApplicationError("not_found", [
          {
            field: "user_id",
            location: "path",
            code: "user_not_found",
            messageKey: "common.notFound",
          },
        ]);

      await this.userService.softDelete(userId, transaction);
      if (passwordHash !== null)
        await this.authCredentialRepository.softDeleteByUserId(userId, transaction);
      await this.authSessionRepository.revokeAllByUserId(userId, new Date(), transaction);
    });
  }

  async findActiveUserIdByAccessToken(accessToken: string): Promise<string | null> {
    const userId = await this.authSessionRepository.findActiveUserIdByAccessTokenHash(
      this.hashToken(accessToken),
      new Date(),
    );
    if (!userId || !(await this.userService.findById(userId))) return null;
    return userId;
  }

  async refreshToken(refreshToken: string): Promise<AuthTokenResponse> {
    const previousRefreshTokenHash = this.hashToken(refreshToken);
    const now = new Date();
    const result = await this.transactionManager.run(async (transaction) => {
      const session = await this.authSessionRepository.findActiveByRefreshTokenHash(
        previousRefreshTokenHash,
        now,
        transaction,
      );
      if (!session) throw new AuthValidationError("refresh_token", "refresh_token_invalid");
      if (!(await this.userService.findById(session.userId, transaction)))
        throw new AuthValidationError("refresh_token", "refresh_token_invalid");
      const issued = this.createSessionTokens(now, session.rememberMe);
      if (
        !(await this.authSessionRepository.rotate(
          session.id,
          previousRefreshTokenHash,
          issued.values,
          transaction,
        ))
      )
        throw new AuthValidationError("refresh_token", "refresh_token_invalid");
      return { userId: session.userId, issued, rememberMe: session.rememberMe };
    });
    return this.toTokenResponse(result.userId, result.issued, result.rememberMe);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.transactionManager.run((transaction) =>
      this.authSessionRepository.revokeByRefreshTokenHash(
        this.hashToken(refreshToken),
        new Date(),
        transaction,
      ),
    );
  }

  private async getVerifiedPasswordHash(userId: string, currentPassword: string): Promise<string> {
    const passwordHash = await this.authCredentialRepository.findPasswordHashByUserId(userId);
    if (!passwordHash || !(await this.passwordHasher.verify(passwordHash, currentPassword)))
      throw CURRENT_PASSWORD_ERROR();
    return passwordHash;
  }

  private createSession(
    userId: string,
    rememberMe: boolean,
  ): { session: AuthSession; response: AuthTokenResponse } {
    const issued = this.createSessionTokens(new Date(), rememberMe);
    const session: AuthSession = {
      id: randomUUIDv7(),
      userId,
      ...issued.values,
      rememberMe,
      revokedAt: null,
    };
    return { session, response: this.toTokenResponse(userId, issued, rememberMe) };
  }

  private createSessionTokens(now: Date, rememberMe: boolean): IssuedTokens {
    const accessToken = randomBytes(32).toString("base64url");
    const refreshToken = randomBytes(32).toString("base64url");
    const refreshTokenTtlSeconds = this.getRefreshTokenTtlSeconds(rememberMe);
    return {
      values: {
        accessTokenHash: this.hashToken(accessToken),
        refreshTokenHash: this.hashToken(refreshToken),
        accessExpiresAt: new Date(
          now.getTime() + this.environment.authAccessTokenTtlSeconds * 1000,
        ),
        refreshExpiresAt: new Date(now.getTime() + refreshTokenTtlSeconds * 1000),
      },
      accessToken,
      refreshToken,
    };
  }

  private toTokenResponse(
    userId: string,
    issued: IssuedTokens,
    rememberMe: boolean,
  ): AuthTokenResponse {
    return {
      access_token: issued.accessToken,
      refresh_token: issued.refreshToken,
      token_type: "Bearer",
      expires_in: this.environment.authAccessTokenTtlSeconds,
      refresh_expires_in: this.getRefreshTokenTtlSeconds(rememberMe),
      user: { id: userId },
    };
  }

  private getRefreshTokenTtlSeconds(rememberMe: boolean): number {
    return rememberMe
      ? this.environment.authRememberMeRefreshTokenTtlSeconds
      : this.environment.authRefreshTokenTtlSeconds;
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
