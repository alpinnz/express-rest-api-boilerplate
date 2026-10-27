import type { Transaction } from "sequelize";
import type { UserRoleAssignment } from "../types/user-role-assignment.type.js";

export interface UserRoleAssignmentServiceApi {
  findRoleAssignmentsForUpdate(
    userIds: string[],
    transaction: Transaction,
  ): Promise<UserRoleAssignment[]>;
  hasUsersWithRole(roleId: string, transaction: Transaction): Promise<boolean>;
  updateRoleId(userId: string, roleId: string, transaction: Transaction): Promise<void>;
}
