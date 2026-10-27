import type { AuthCredentialRepository } from "./auth-credential-repository.type.js";
import type { AuthCredentialModel } from "../model/auth-credential-model.type.js";
import type { Transaction } from "sequelize";
import type { TransactionManager } from "../../../shared/database/transaction-manager.js";
import { translateDatabaseError } from "../../../shared/database/database-error.js";
export class SequelizeAuthCredentialRepository implements AuthCredentialRepository {
  constructor(
    private readonly authCredentialModel: AuthCredentialModel,
    private readonly transactionManager: TransactionManager,
  ) {}
  async create(userId: string, passwordHash: string, transaction: Transaction): Promise<void> {
    this.transactionManager.assertActive(transaction);
    try {
      await this.authCredentialModel.create(
        { userId, passwordHash, deletedAt: null },
        this.transactionManager.options(transaction),
      );
    } catch (error) {
      this.transactionManager.markFailed(transaction);
      throw translateDatabaseError(error);
    }
  }
  async findPasswordHashByUserId(userId: string): Promise<string | null> {
    try {
      const credential = await this.authCredentialModel.findOne({
        where: { userId, deletedAt: null },
      });
      return credential?.passwordHash ?? null;
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async findPasswordHashByUserIdForUpdate(
    userId: string,
    transaction: Transaction,
  ): Promise<string | null> {
    this.transactionManager.assertActive(transaction);
    try {
      const credential = await this.authCredentialModel.findOne({
        ...this.transactionManager.options(transaction),
        where: { userId, deletedAt: null },
        lock: transaction.LOCK.UPDATE,
      });
      return credential?.passwordHash ?? null;
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
    transaction: Transaction,
  ): Promise<boolean> {
    this.transactionManager.assertActive(transaction);
    try {
      const [count] = await this.authCredentialModel.update(
        { passwordHash },
        {
          ...this.transactionManager.options(transaction),
          where: { userId, deletedAt: null },
        },
      );
      return count === 1;
    } catch (error) {
      this.transactionManager.markFailed(transaction);
      throw translateDatabaseError(error);
    }
  }

  async softDeleteByUserId(userId: string, transaction: Transaction): Promise<void> {
    this.transactionManager.assertActive(transaction);
    try {
      const [updatedCount] = await this.authCredentialModel.update(
        { passwordHash: null, deletedAt: new Date() },
        {
          ...this.transactionManager.options(transaction),
          where: { userId, deletedAt: null },
        },
      );
      if (updatedCount !== 1)
        throw new Error("Active auth credential is missing during account deactivation");
    } catch (error) {
      this.transactionManager.markFailed(transaction);
      throw translateDatabaseError(error);
    }
  }
}
