import type { Transaction } from "sequelize";
import type { AuthSession, AuthSessionTokens } from "../types/auth-session.type.js";

export interface AuthSessionRepository {
  create(session: AuthSession, transaction: Transaction): Promise<void>;
  findActiveUserIdByAccessTokenHash(accessTokenHash: string, now: Date): Promise<string | null>;
  findActiveByRefreshTokenHash(
    refreshTokenHash: string,
    now: Date,
    transaction: Transaction,
  ): Promise<AuthSession | null>;
  rotate(
    sessionId: string,
    currentRefreshTokenHash: string,
    tokens: AuthSessionTokens,
    transaction: Transaction,
  ): Promise<boolean>;
  revokeByRefreshTokenHash(
    refreshTokenHash: string,
    revokedAt: Date,
    transaction: Transaction,
  ): Promise<void>;
  revokeAllByUserId(userId: string, revokedAt: Date, transaction: Transaction): Promise<void>;
}
