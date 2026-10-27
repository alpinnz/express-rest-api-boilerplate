import type { Transaction } from "sequelize";
import type { Role } from "../entity/role.entity.js";

export interface RoleRepository {
  findById(roleId: string, transaction?: Transaction): Promise<Role | null>;
  findByIdsForUpdate(roleIds: string[], transaction: Transaction): Promise<Role[]>;
  findByName(name: string, transaction?: Transaction): Promise<Role | null>;
  list(transaction?: Transaction): Promise<Role[]>;
  create(role: Role, transaction: Transaction): Promise<Role>;
  update(role: Role, transaction: Transaction): Promise<Role>;
  softDelete(roleId: string, transaction: Transaction): Promise<boolean>;
}
