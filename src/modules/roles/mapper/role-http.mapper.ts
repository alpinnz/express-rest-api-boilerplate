import type { Role } from "../entity/role.entity.js";
import type { RoleResponse } from "../types/role-response.type.js";

export function toRoleResponse(role: Role): RoleResponse {
  return { id: role.id, name: role.name, level: role.level };
}
