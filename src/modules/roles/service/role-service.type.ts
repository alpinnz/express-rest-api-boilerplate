import type { Transaction } from "sequelize";
import type { Role } from "../entity/role.entity.js";
import type { CreateRoleRequest, UpdateRoleRequest } from "../types/role-request.type.js";

export interface RoleServiceApi {
  getDefaultRoleId(transaction?: Transaction): Promise<string>;
  list(): Promise<Role[]>;
  create(actorUserId: string, input: CreateRoleRequest): Promise<Role>;
  get(roleId: string): Promise<Role>;
  update(actorUserId: string, roleId: string, input: UpdateRoleRequest): Promise<Role>;
  softDelete(actorUserId: string, roleId: string): Promise<void>;
  changeUserRole(actorUserId: string, targetUserId: string, roleId: string): Promise<void>;
}
