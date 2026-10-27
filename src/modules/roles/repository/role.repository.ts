import { Op, UniqueConstraintError } from "sequelize";
import type { Transaction } from "sequelize";
import { ApplicationError } from "../../../shared/errors/application-error.js";
import type { Role } from "../entity/role.entity.js";
import { toRoleEntity } from "../mapper/role-persistence.mapper.js";
import type { RoleModel } from "../model/role-model.type.js";
import type { RoleRepository } from "./role-repository.type.js";
import type { TransactionManager } from "../../../shared/database/transaction-manager.js";
import { translateDatabaseError } from "../../../shared/database/database-error.js";

export class SequelizeRoleRepository implements RoleRepository {
  constructor(
    private readonly roleModel: RoleModel,
    private readonly transactionManager: TransactionManager,
  ) {}

  async findById(roleId: string, transaction?: Transaction): Promise<Role | null> {
    try {
      const row = await this.roleModel.findByPk(
        roleId,
        this.transactionManager.options(transaction),
      );
      return row ? toRoleEntity(row) : null;
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async findByIdsForUpdate(roleIds: string[], transaction: Transaction): Promise<Role[]> {
    this.transactionManager.assertActive(transaction);
    try {
      const rows = await this.roleModel.findAll({
        ...this.transactionManager.options(transaction),
        where: { id: { [Op.in]: [...new Set(roleIds)] } },
        order: [["id", "ASC"]],
        lock: transaction.LOCK.UPDATE,
      });
      return rows.map(toRoleEntity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async findByName(name: string, transaction?: Transaction): Promise<Role | null> {
    try {
      const row = await this.roleModel.findOne({
        ...this.transactionManager.options(transaction),
        where: { name },
      });
      return row ? toRoleEntity(row) : null;
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async list(transaction?: Transaction): Promise<Role[]> {
    try {
      const rows = await this.roleModel.findAll({
        ...this.transactionManager.options(transaction),
        order: [
          ["level", "DESC"],
          ["name", "ASC"],
        ],
      });
      return rows.map(toRoleEntity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async create(role: Role, transaction: Transaction): Promise<Role> {
    try {
      const row = await this.roleModel.create(
        { id: role.id, name: role.name, level: role.level },
        this.transactionManager.options(transaction),
      );
      return toRoleEntity(row);
    } catch (error) {
      throw translateRoleDatabaseError(error);
    }
  }

  async update(role: Role, transaction: Transaction): Promise<Role> {
    try {
      const [updatedCount] = await this.roleModel.update(
        { name: role.name, level: role.level },
        {
          ...this.transactionManager.options(transaction),
          where: { id: role.id },
        },
      );
      if (!updatedCount) throw roleNotFound();
      const row = await this.roleModel.findByPk(
        role.id,
        this.transactionManager.options(transaction),
      );
      if (!row) throw roleNotFound();
      return toRoleEntity(row);
    } catch (error) {
      throw translateRoleDatabaseError(error);
    }
  }

  async softDelete(roleId: string, transaction: Transaction): Promise<boolean> {
    try {
      return (
        (await this.roleModel.destroy({
          ...this.transactionManager.options(transaction),
          where: { id: roleId },
        })) > 0
      );
    } catch (error) {
      throw translateRoleDatabaseError(error);
    }
  }
}

function roleNotFound(): ApplicationError {
  return new ApplicationError("not_found", [
    {
      field: "role_id",
      location: "path",
      code: "role_not_found",
      messageKey: "roles.roleNotFound",
    },
  ]);
}

function translateRoleDatabaseError(error: unknown): Error {
  if (error instanceof UniqueConstraintError)
    return new ApplicationError("conflict", [
      {
        field: "name",
        location: "body",
        code: "role_name_already_exists",
        messageKey: "roles.roleNameAlreadyExists",
      },
    ]);
  return translateDatabaseError(error);
}
