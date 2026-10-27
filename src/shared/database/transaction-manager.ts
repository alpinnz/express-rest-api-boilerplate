import type { Sequelize, Transaction } from "sequelize";
import { ApplicationError } from "../errors/application-error.js";
import { translateDatabaseError } from "./database-error.js";

export class TransactionManager {
  private readonly active = new WeakSet<Transaction>();
  private readonly failed = new WeakSet<Transaction>();

  constructor(private readonly database: Sequelize) {}

  assertActive(transaction: Transaction): void {
    if (!this.active.has(transaction) || this.failed.has(transaction)) {
      throw new ApplicationError("service_unavailable");
    }
  }

  markFailed(transaction: Transaction): void {
    if (!this.active.has(transaction)) throw new ApplicationError("service_unavailable");
    this.failed.add(transaction);
  }

  options(transaction?: Transaction): { transaction?: Transaction } {
    if (!transaction) return {};
    this.assertActive(transaction);
    return { transaction };
  }

  async run<TResult>(
    work: (transaction: Transaction) => Promise<TResult>,
    existing?: Transaction,
  ): Promise<TResult> {
    if (existing) {
      this.assertActive(existing);
      try {
        return await work(existing);
      } catch (error) {
        this.markFailed(existing);
        throw error;
      }
    }
    try {
      return await this.database.transaction(async (transaction) => {
        this.active.add(transaction);
        try {
          const result = await work(transaction);
          this.assertActive(transaction);
          return result;
        } finally {
          this.active.delete(transaction);
          this.failed.delete(transaction);
        }
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}
