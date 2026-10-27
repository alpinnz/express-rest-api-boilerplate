import type { Transaction } from "sequelize";
import { ApplicationError } from "../../../shared/errors/application-error.js";
import type { TransactionManager } from "../../../shared/database/transaction-manager.js";
import { randomUUIDv7 } from "../../../shared/uuid/uuid-v7.js";
import type { UserRoleAssignmentServiceApi } from "../../users/service/user-role-assignment-service.type.js";
import { Role } from "../entity/role.entity.js";
import { DEFAULT_ROLE_NAME, SYSTEM_ROLES } from "../entity/system-role-catalog.js";
import type { RoleRepository } from "../repository/role-repository.type.js";
import type { CreateRoleRequest, UpdateRoleRequest } from "../types/role-request.type.js";
import type { RoleServiceApi } from "./role-service.type.js";

const SYSTEM_ROLE_NAMES = new Set<string>(SYSTEM_ROLES.map(({ name }) => name));

export class RoleService implements RoleServiceApi {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly userService: UserRoleAssignmentServiceApi,
    private readonly transactionManager: TransactionManager,
  ) {}

  async getDefaultRoleId(transaction?: Transaction): Promise<string> {
    const role = await this.roleRepository.findByName(DEFAULT_ROLE_NAME, transaction);
    if (!role) throw new Error("Default user role is missing");
    return role.id;
  }

  list() {
    return this.roleRepository.list();
  }

  async create(actorUserId: string, input: CreateRoleRequest): Promise<Role> {
    return this.transactionManager.run(async (transaction) => {
      const actorRole = await this.findActorRole(actorUserId, transaction);
      this.assertLevelBelowActor(actorRole, input.level, "body");
      const now = new Date();
      const role = new Role({
        id: randomUUIDv7(),
        name: input.name,
        level: input.level,
        createdAt: now,
        updatedAt: now,
      });
      return this.roleRepository.create(role, transaction);
    });
  }

  async get(roleId: string): Promise<Role> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw roleNotFound();
    return role;
  }

  async update(actorUserId: string, roleId: string, input: UpdateRoleRequest): Promise<Role> {
    return this.transactionManager.run(async (transaction) => {
      const actorAssignment = await this.findActorAssignment(actorUserId, transaction);
      const roles = await this.roleRepository.findByIdsForUpdate(
        [actorAssignment.roleId, roleId],
        transaction,
      );
      const actorRole = roles.find(({ id }) => id === actorAssignment.roleId);
      const currentRole = roles.find(({ id }) => id === roleId);
      if (!actorRole) throw new Error("User role assignment is invalid");
      if (!currentRole) throw roleNotFound();
      this.assertRoleCanBeManaged(actorRole, currentRole);

      const updatedRole = new Role({
        id: currentRole.id,
        name: input.name ?? currentRole.name,
        level: input.level ?? currentRole.level,
        createdAt: currentRole.createdAt,
        updatedAt: new Date(),
      });
      this.assertLevelBelowActor(actorRole, updatedRole.level, "body");
      return this.roleRepository.update(updatedRole, transaction);
    });
  }

  async softDelete(actorUserId: string, roleId: string): Promise<void> {
    await this.transactionManager.run(async (transaction) => {
      const actorAssignment = await this.findActorAssignment(actorUserId, transaction);
      const roles = await this.roleRepository.findByIdsForUpdate(
        [actorAssignment.roleId, roleId],
        transaction,
      );
      const actorRole = roles.find(({ id }) => id === actorAssignment.roleId);
      const role = roles.find(({ id }) => id === roleId);
      if (!actorRole) throw new Error("User role assignment is invalid");
      if (!role) throw roleNotFound();
      this.assertRoleCanBeManaged(actorRole, role);
      if (await this.userService.hasUsersWithRole(roleId, transaction))
        throw new ApplicationError("conflict", [
          {
            field: "role_id",
            location: "path",
            code: "role_in_use",
            messageKey: "roles.roleInUse",
          },
        ]);
      if (!(await this.roleRepository.softDelete(roleId, transaction))) throw roleNotFound();
    });
  }

  private async findActorAssignment(actorUserId: string, transaction: Transaction) {
    const [assignment] = await this.userService.findRoleAssignmentsForUpdate(
      [actorUserId],
      transaction,
    );
    if (!assignment)
      throw new ApplicationError("unauthorized", [
        {
          field: "Authorization",
          location: "header",
          code: "access_token_invalid",
          messageKey: "common.accessTokenInvalid",
        },
      ]);
    return assignment;
  }

  private async findActorRole(actorUserId: string, transaction: Transaction) {
    const assignment = await this.findActorAssignment(actorUserId, transaction);
    const [role] = await this.roleRepository.findByIdsForUpdate([assignment.roleId], transaction);
    if (!role) throw new Error("User role assignment is invalid");
    return role;
  }

  private assertRoleCanBeManaged(actorRole: Role, role: Role): void {
    if (SYSTEM_ROLE_NAMES.has(role.name))
      throw new ApplicationError("forbidden", [
        {
          field: "role_id",
          location: "path",
          code: "system_role_protected",
          messageKey: "roles.systemRoleProtected",
        },
      ]);
    this.assertLevelBelowActor(actorRole, role.level, "path");
  }

  private assertLevelBelowActor(
    actorRole: Role,
    roleLevel: number,
    location: "body" | "path",
  ): void {
    if (roleLevel < actorRole.level) return;
    throw new ApplicationError("forbidden", [
      {
        field: location === "body" ? "level" : "role_id",
        location,
        code: "role_management_level_insufficient",
        messageKey: "roles.roleManagementLevelInsufficient",
      },
    ]);
  }

  async changeUserRole(actorUserId: string, targetUserId: string, roleId: string): Promise<void> {
    if (actorUserId === targetUserId)
      throw new ApplicationError("forbidden", [
        {
          field: "user_id",
          location: "path",
          code: "self_role_change_forbidden",
          messageKey: "roles.selfRoleChangeForbidden",
        },
      ]);

    await this.transactionManager.run(async (transaction) => {
      const assignments = await this.userService.findRoleAssignmentsForUpdate(
        [actorUserId, targetUserId],
        transaction,
      );
      const actorAssignment = assignments.find(({ userId }) => userId === actorUserId);
      const targetAssignment = assignments.find(({ userId }) => userId === targetUserId);
      if (!actorAssignment)
        throw new ApplicationError("unauthorized", [
          {
            field: "Authorization",
            location: "header",
            code: "access_token_invalid",
            messageKey: "common.accessTokenInvalid",
          },
        ]);
      if (!targetAssignment)
        throw new ApplicationError("not_found", [
          {
            field: "user_id",
            location: "path",
            code: "user_not_found",
            messageKey: "common.notFound",
          },
        ]);

      const roles = await this.roleRepository.findByIdsForUpdate(
        [actorAssignment.roleId, targetAssignment.roleId, roleId],
        transaction,
      );
      const rolesById = new Map(roles.map((role) => [role.id, role]));
      const actorRole = rolesById.get(actorAssignment.roleId);
      const targetRole = rolesById.get(targetAssignment.roleId);
      const nextRole = rolesById.get(roleId);
      if (!actorRole || !targetRole) throw new Error("User role assignment is invalid");
      if (!nextRole)
        throw new ApplicationError("not_found", [
          {
            field: "role_id",
            location: "body",
            code: "role_not_found",
            messageKey: "roles.roleNotFound",
          },
        ]);

      if (actorRole.level <= targetRole.level || actorRole.level <= nextRole.level)
        throw new ApplicationError("forbidden", [
          {
            field: "role_id",
            location: "body",
            code: "role_level_insufficient",
            messageKey: "roles.roleLevelInsufficient",
          },
        ]);
      if (targetAssignment.roleId === nextRole.id)
        throw new ApplicationError("conflict", [
          {
            field: "role_id",
            location: "body",
            code: "role_unchanged",
            messageKey: "roles.roleUnchanged",
          },
        ]);

      await this.userService.updateRoleId(targetUserId, nextRole.id, transaction);
    });
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
