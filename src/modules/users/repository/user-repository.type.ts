import type { Transaction } from "sequelize";
import type { User } from "../entity/user.entity.js";
import type { UserListPagination } from "../types/user-pagination.type.js";
import type { UserRoleAssignment } from "../types/user-role-assignment.type.js";
import type { UserProfileWithRole } from "../types/user-profile-with-role.type.js";
export interface UserRepository {
  create(user: User, transaction: Transaction): Promise<User>;
  findById(userId: string, transaction?: Transaction): Promise<User | null>;
  findProfileById(userId: string, transaction?: Transaction): Promise<UserProfileWithRole | null>;
  findByEmail(email: string, transaction?: Transaction): Promise<User | null>;
  list(
    pagination: UserListPagination,
    transaction?: Transaction,
  ): Promise<{ items: User[]; total: number }>;
  update(user: User, transaction: Transaction): Promise<User>;
  softDelete(userId: string, transaction: Transaction): Promise<boolean>;
  findRoleAssignmentsForUpdate(
    userIds: string[],
    transaction: Transaction,
  ): Promise<UserRoleAssignment[]>;
  hasUsersWithRole(roleId: string, transaction: Transaction): Promise<boolean>;
  updateRoleId(userId: string, roleId: string, transaction: Transaction): Promise<void>;
}
