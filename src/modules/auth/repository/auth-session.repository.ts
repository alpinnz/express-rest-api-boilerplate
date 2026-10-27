import { Op, type Transaction } from "sequelize";
import type { AuthSessionRepository } from "./auth-session-repository.type.js";
import type { AuthSession, AuthSessionTokens } from "../types/auth-session.type.js";
import type { TransactionManager } from "../../../shared/database/transaction-manager.js";
import { translateDatabaseError } from "../../../shared/database/database-error.js";
import type { AuthSessionModel } from "../model/auth-session-model.type.js";

export class SequelizeAuthSessionRepository implements AuthSessionRepository {
  constructor(
    private readonly authSessionModel: AuthSessionModel,
    private readonly transactionManager: TransactionManager,
  ) {}

  async create(session: AuthSession, transaction: Transaction): Promise<void> {
    this.transactionManager.assertActive(transaction);
    try {
      await this.authSessionModel.create(session, this.transactionManager.options(transaction));
    } catch (error) {
      this.transactionManager.markFailed(transaction);
      throw translateDatabaseError(error);
    }
  }

  async findActiveUserIdByAccessTokenHash(
    accessTokenHash: string,
    now: Date,
  ): Promise<string | null> {
    try {
      const row = await this.authSessionModel.findOne({
        where: {
          accessTokenHash,
          revokedAt: null,
          accessExpiresAt: { [Op.gt]: now },
        },
        attributes: ["userId"],
      });
      return row?.userId ?? null;
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async findActiveByRefreshTokenHash(
    refreshTokenHash: string,
    now: Date,
    transaction: Transaction,
  ): Promise<AuthSession | null> {
    this.transactionManager.assertActive(transaction);
    try {
      const row = await this.authSessionModel.findOne({
        ...this.transactionManager.options(transaction),
        where: {
          refreshTokenHash,
          revokedAt: null,
          refreshExpiresAt: { [Op.gt]: now },
        },
        lock: transaction.LOCK.UPDATE,
      });
      if (!row) return null;
      return {
        id: row.id,
        userId: row.userId,
        accessTokenHash: row.accessTokenHash,
        refreshTokenHash: row.refreshTokenHash,
        accessExpiresAt: row.accessExpiresAt,
        refreshExpiresAt: row.refreshExpiresAt,
        rememberMe: row.rememberMe,
        revokedAt: row.revokedAt,
      };
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async rotate(
    sessionId: string,
    currentRefreshTokenHash: string,
    tokens: AuthSessionTokens,
    transaction: Transaction,
  ): Promise<boolean> {
    this.transactionManager.assertActive(transaction);
    try {
      const [count] = await this.authSessionModel.update(tokens, {
        ...this.transactionManager.options(transaction),
        where: { id: sessionId, refreshTokenHash: currentRefreshTokenHash, revokedAt: null },
      });
      return count === 1;
    } catch (error) {
      this.transactionManager.markFailed(transaction);
      throw translateDatabaseError(error);
    }
  }

  async revokeByRefreshTokenHash(
    refreshTokenHash: string,
    revokedAt: Date,
    transaction: Transaction,
  ): Promise<void> {
    this.transactionManager.assertActive(transaction);
    try {
      await this.authSessionModel.update(
        { revokedAt },
        {
          ...this.transactionManager.options(transaction),
          where: { refreshTokenHash, revokedAt: null },
        },
      );
    } catch (error) {
      this.transactionManager.markFailed(transaction);
      throw translateDatabaseError(error);
    }
  }

  async revokeAllByUserId(
    userId: string,
    revokedAt: Date,
    transaction: Transaction,
  ): Promise<void> {
    this.transactionManager.assertActive(transaction);
    try {
      await this.authSessionModel.update(
        { revokedAt },
        {
          ...this.transactionManager.options(transaction),
          where: { userId, revokedAt: null },
        },
      );
    } catch (error) {
      this.transactionManager.markFailed(transaction);
      throw translateDatabaseError(error);
    }
  }
}
