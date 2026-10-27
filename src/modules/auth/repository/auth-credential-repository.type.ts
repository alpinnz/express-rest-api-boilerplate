import type { Transaction } from "sequelize";

export interface AuthCredentialRepository {
  create(userId: string, passwordHash: string, transaction: Transaction): Promise<void>;
  findPasswordHashByUserId(userId: string): Promise<string | null>;
  findPasswordHashByUserIdForUpdate(
    userId: string,
    transaction: Transaction,
  ): Promise<string | null>;
  updatePasswordHash(
    userId: string,
    passwordHash: string,
    transaction: Transaction,
  ): Promise<boolean>;
  softDeleteByUserId(userId: string, transaction: Transaction): Promise<void>;
}
