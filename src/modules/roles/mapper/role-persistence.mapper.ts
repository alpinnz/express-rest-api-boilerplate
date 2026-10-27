import { Role } from "../entity/role.entity.js";
import type { RoleModelRow } from "../model/role-model.type.js";

export function toRoleEntity(row: RoleModelRow): Role {
  return new Role({
    id: row.id,
    name: row.name,
    level: row.level,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
