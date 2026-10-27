import type { Transaction } from "sequelize";
import type { User } from "../entity/user.entity.js";
import type { UpdateUserCommand } from "../types/user-command.type.js";
import type { UserListPagination } from "../types/user-pagination.type.js";
import type { UserProfileWithRole } from "../types/user-profile-with-role.type.js";
import type { UserProfileServiceApi } from "./user-profile-service.type.js";
import type { UserRoleAssignmentServiceApi } from "./user-role-assignment-service.type.js";

export interface UserServiceApi extends UserProfileServiceApi, UserRoleAssignmentServiceApi {
  get(userId: string, transaction?: Transaction): Promise<User>;
  getProfileWithRole(userId: string): Promise<UserProfileWithRole>;
  list(pagination: UserListPagination): Promise<{ items: User[]; total: number }>;
  update(input: UpdateUserCommand, transaction?: Transaction): Promise<User>;
}
