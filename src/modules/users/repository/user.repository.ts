import type { UserRepository } from "./user-repository.type.js";
import type { UserListPagination } from "../types/user-pagination.type.js";
import type { User } from "../entity/user.entity.js";
import type { Transaction } from "sequelize";
import type { TransactionManager } from "../../../shared/database/transaction-manager.js";
import { translateUserDatabaseError } from "./user-database-error.js";
import type { UserModel } from "../model/user-model.type.js";
import { toUserEntity } from "../mapper/user-persistence.mapper.js";
import { ApplicationError } from "../../../shared/errors/application-error.js";
import type { UserRoleAssignment } from "../types/user-role-assignment.type.js";
import type { UserProfileWithRole } from "../types/user-profile-with-role.type.js";
import { Op } from "sequelize";

export class SequelizeUserRepository implements UserRepository {
  constructor(
    private readonly userModel: UserModel,
    private readonly transactionManager: TransactionManager,
  ) {}
  private async write<TResult>(
    transaction: Transaction,
    work: () => Promise<TResult>,
  ): Promise<TResult> {
    this.transactionManager.assertActive(transaction);
    try {
      return await work();
    } catch (error) {
      this.transactionManager.markFailed(transaction);
      throw translateUserDatabaseError(error);
    }
  }
  create(user: User, transaction: Transaction): Promise<User> {
    return this.write(transaction, async () =>
      toUserEntity(
        await this.userModel.create(
          {
            id: user.id,
            role_id: user.roleId,
            name: user.name,
            email: user.email,
            phone_number: user.phone_number,
            country_code: user.country_code,
          },
          this.transactionManager.options(transaction),
        ),
      ),
    );
  }
  async findById(userId: string, transaction?: Transaction): Promise<User | null> {
    try {
      const row = await this.userModel.findByPk(
        userId,
        this.transactionManager.options(transaction),
      );
      return row ? toUserEntity(row) : null;
    } catch (error) {
      throw translateUserDatabaseError(error);
    }
  }
  async findProfileById(
    userId: string,
    transaction?: Transaction,
  ): Promise<UserProfileWithRole | null> {
    try {
      const row = await this.userModel.findByPk(userId, {
        ...this.transactionManager.options(transaction),
        include: [
          {
            association: "role",
            attributes: ["id", "name", "level"],
          },
        ],
      });
      if (!row) return null;
      if (!row.role) throw new Error("Persisted user is missing its role association");
      return {
        user: toUserEntity(row),
        role: { id: row.role.id, name: row.role.name, level: row.role.level },
      };
    } catch (error) {
      throw translateUserDatabaseError(error);
    }
  }
  async findByEmail(email: string, transaction?: Transaction): Promise<User | null> {
    try {
      const row = await this.userModel.findOne({
        ...this.transactionManager.options(transaction),
        where: { email },
      });
      return row ? toUserEntity(row) : null;
    } catch (error) {
      throw translateUserDatabaseError(error);
    }
  }
  async list(pagination: UserListPagination, transaction?: Transaction) {
    try {
      const result = await this.userModel.findAndCountAll({
        ...this.transactionManager.options(transaction),
        order: [
          ["createdAt", "DESC"],
          ["id", "ASC"],
        ],
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
      });
      return { items: result.rows.map(toUserEntity), total: result.count };
    } catch (error) {
      throw translateUserDatabaseError(error);
    }
  }
  update(user: User, transaction: Transaction): Promise<User> {
    return this.write(transaction, async () => {
      const [count] = await this.userModel.update(
        {
          name: user.name,
          email: user.email,
          phone_number: user.phone_number,
          country_code: user.country_code,
        },
        {
          ...this.transactionManager.options(transaction),
          where: { id: user.id },
        },
      );
      if (!count) throw new ApplicationError("not_found");
      const updated = await this.findById(user.id, transaction);
      if (!updated) throw new ApplicationError("not_found");
      return updated;
    });
  }
  softDelete(userId: string, transaction: Transaction): Promise<boolean> {
    return this.write(
      transaction,
      async () =>
        (await this.userModel.destroy({
          ...this.transactionManager.options(transaction),
          where: { id: userId },
        })) > 0,
    );
  }
  async findRoleAssignmentsForUpdate(
    userIds: string[],
    transaction: Transaction,
  ): Promise<UserRoleAssignment[]> {
    this.transactionManager.assertActive(transaction);
    try {
      const rows = await this.userModel.findAll({
        ...this.transactionManager.options(transaction),
        where: { id: { [Op.in]: [...new Set(userIds)] } },
        order: [["id", "ASC"]],
        lock: transaction.LOCK.UPDATE,
      });
      return rows.map((row) => ({ userId: row.id, roleId: row.role_id }));
    } catch (error) {
      throw translateUserDatabaseError(error);
    }
  }
  async hasUsersWithRole(roleId: string, transaction: Transaction): Promise<boolean> {
    this.transactionManager.assertActive(transaction);
    try {
      return (
        (await this.userModel.count({
          ...this.transactionManager.options(transaction),
          where: { role_id: roleId },
        })) > 0
      );
    } catch (error) {
      throw translateUserDatabaseError(error);
    }
  }
  updateRoleId(userId: string, roleId: string, transaction: Transaction): Promise<void> {
    return this.write(transaction, async () => {
      const [count] = await this.userModel.update(
        { role_id: roleId },
        {
          ...this.transactionManager.options(transaction),
          where: { id: userId },
        },
      );
      if (!count) throw new ApplicationError("not_found");
    });
  }
}
