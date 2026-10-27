import assert from "node:assert/strict";
import test from "node:test";
import type { Transaction } from "sequelize";
import { ApplicationError } from "../../src/shared/errors/application-error.js";
import { Role } from "../../src/modules/roles/entity/role.entity.js";
import { RoleService } from "../../src/modules/roles/service/role.service.js";

const ownerId = "019a34c0-0000-7000-8000-000000000001";
const userId = "019a34c0-0000-7000-8000-000000000002";
const ownerRoleId = "019a34c0-0000-7000-8000-000000000003";
const customRoleId = "019a34c0-0000-7000-8000-000000000004";
const nextRoleId = "019a34c0-0000-7000-8000-000000000005";
const staffRoleId = "019a34c0-0000-7000-8000-000000000006";
const defaultUserRoleId = "019a34c0-0000-7000-8000-000000000007";
const now = new Date("2026-10-27T00:00:00.000Z");

function createRole(id: string, name: string, level: number): Role {
  return new Role({ id, name, level, createdAt: now, updatedAt: now });
}

type RoleServiceOptions = {
  roles?: Role[];
  assignments?: Array<{ userId: string; roleId: string }>;
  usersHaveRole?: boolean;
  deletionSucceeds?: boolean;
};

function createRoleService(options: RoleServiceOptions = {}) {
  const roles = options.roles ?? [
    createRole(ownerRoleId, "owner", 100),
    createRole(customRoleId, "analyst", 40),
    createRole(nextRoleId, "support", 20),
    createRole(staffRoleId, "staff", 50),
    createRole(defaultUserRoleId, "user", 10),
  ];
  const assignments = options.assignments ?? [
    { userId: ownerId, roleId: ownerRoleId },
    { userId, roleId: customRoleId },
  ];
  const calls: Array<{ name: string; arguments: unknown[] }> = [];
  const roleRepository = {
    findByName: async (...args: unknown[]) => {
      calls.push({ name: "findByName", arguments: args });
      return roles.find((role) => role.name === args[0]) ?? null;
    },
    list: async () => {
      calls.push({ name: "list", arguments: [] });
      return roles;
    },
    create: async (...args: unknown[]) => {
      calls.push({ name: "create", arguments: args });
      return args[0] as Role;
    },
    findById: async (id: string) => {
      calls.push({ name: "findById", arguments: [id] });
      return roles.find((role) => role.id === id) ?? null;
    },
    findByIdsForUpdate: async (ids: string[], ...args: unknown[]) => {
      calls.push({ name: "findByIdsForUpdate", arguments: [ids, ...args] });
      return roles.filter((role) => ids.includes(role.id));
    },
    update: async (...args: unknown[]) => {
      calls.push({ name: "update", arguments: args });
      return args[0] as Role;
    },
    softDelete: async (...args: unknown[]) => {
      calls.push({ name: "softDelete", arguments: args });
      return options.deletionSucceeds !== false;
    },
  };
  const userService = {
    findRoleAssignmentsForUpdate: async (ids: string[], ...args: unknown[]) => {
      calls.push({ name: "findRoleAssignmentsForUpdate", arguments: [ids, ...args] });
      return assignments.filter(({ userId: assignedUserId }) => ids.includes(assignedUserId));
    },
    hasUsersWithRole: async (...args: unknown[]) => {
      calls.push({ name: "hasUsersWithRole", arguments: args });
      return options.usersHaveRole === true;
    },
    updateRoleId: async (...args: unknown[]) => {
      calls.push({ name: "updateRoleId", arguments: args });
    },
  };
  const service = new RoleService(roleRepository, userService, {
    run: async <TResult>(work: (transaction: Transaction) => Promise<TResult>) =>
      work({} as Transaction),
  } as never);
  return { service, calls };
}

async function assertApplicationError(
  promise: Promise<unknown>,
  kind: ApplicationError["kind"],
): Promise<void> {
  await assert.rejects(
    promise,
    (error: unknown) => error instanceof ApplicationError && error.kind === kind,
  );
}

void test("RoleService reads the default role, list, and individual roles", async (context) => {
  const configured = createRoleService();
  await context.test("default role", async () => {
    assert.equal(await configured.service.getDefaultRoleId(), defaultUserRoleId);
  });
  await context.test("catalog", async () => {
    assert.equal((await configured.service.list()).length, 5);
  });
  await context.test("existing role", async () => {
    assert.equal((await configured.service.get(customRoleId)).name, "analyst");
  });
  await context.test("missing default role is a configuration error", async () => {
    const missing = createRoleService({ roles: [] });
    await assert.rejects(missing.service.getDefaultRoleId(), /Default user role is missing/);
  });
  await context.test("missing role returns not found", async () => {
    await assertApplicationError(configured.service.get("unknown"), "not_found");
  });
});

void test("RoleService creates and updates only roles below the actor", async (context) => {
  const configured = createRoleService();
  await context.test("create lower role", async () => {
    const created = await configured.service.create(ownerId, { name: "reviewer", level: 30 });
    assert.equal(created.name, "reviewer");
    assert.equal(created.level, 30);
    assert.match(created.id, /^[0-9a-f-]{36}$/);
  });
  await context.test("create at owner level is forbidden", async () => {
    await assertApplicationError(
      configured.service.create(ownerId, { name: "same-level", level: 100 }),
      "forbidden",
    );
  });
  await context.test("create with missing actor assignment is unauthorized", async () => {
    const missingActor = createRoleService({ assignments: [] });
    await assertApplicationError(
      missingActor.service.create(ownerId, { name: "reviewer", level: 30 }),
      "unauthorized",
    );
  });
  await context.test("create with missing actor role is an invariant error", async () => {
    const missingRole = createRoleService({
      roles: [createRole(customRoleId, "analyst", 40)],
      assignments: [{ userId: ownerId, roleId: ownerRoleId }],
    });
    await assert.rejects(
      missingRole.service.create(ownerId, { name: "reviewer", level: 30 }),
      /User role assignment is invalid/,
    );
  });
  await context.test("update lower custom role", async () => {
    const updated = await configured.service.update(ownerId, customRoleId, { name: "auditor" });
    assert.equal(updated.name, "auditor");
    assert.equal(updated.level, 40);
  });
  await context.test("update cannot modify a system role", async () => {
    await assertApplicationError(
      configured.service.update(ownerId, staffRoleId, { name: "changed" }),
      "forbidden",
    );
  });
  await context.test("update cannot raise role to actor level", async () => {
    await assertApplicationError(
      configured.service.update(ownerId, customRoleId, { level: 100 }),
      "forbidden",
    );
  });
  await context.test("update reports a removed target role", async () => {
    await assertApplicationError(configured.service.update(ownerId, "unknown", {}), "not_found");
  });
  await context.test("update reports a missing actor role assignment", async () => {
    await assert.rejects(
      createRoleService({ roles: [createRole(customRoleId, "analyst", 40)] }).service.update(
        ownerId,
        customRoleId,
        {},
      ),
      /User role assignment is invalid/,
    );
  });
});

void test("RoleService soft-deletes only unused custom roles", async (context) => {
  await context.test("delete unused custom role", async () => {
    const { service, calls } = createRoleService();
    await service.softDelete(ownerId, nextRoleId);
    assert.equal(
      calls.some(({ name }) => name === "softDelete"),
      true,
    );
  });
  await context.test("reject delete while active users still have role", async () => {
    await assertApplicationError(
      createRoleService({ usersHaveRole: true }).service.softDelete(ownerId, customRoleId),
      "conflict",
    );
  });
  await context.test("reject delete of a system role", async () => {
    await assertApplicationError(
      createRoleService().service.softDelete(ownerId, staffRoleId),
      "forbidden",
    );
  });
  await context.test("missing role returns not found", async () => {
    await assertApplicationError(
      createRoleService().service.softDelete(ownerId, "unknown"),
      "not_found",
    );
  });
  await context.test("failed delete after selection returns not found", async () => {
    await assertApplicationError(
      createRoleService({ deletionSucceeds: false }).service.softDelete(ownerId, nextRoleId),
      "not_found",
    );
  });
});

void test("RoleService changes another user's role only to a strictly lower role", async (context) => {
  await context.test("assign lower role", async () => {
    const { service, calls } = createRoleService();
    await service.changeUserRole(ownerId, userId, nextRoleId);
    assert.equal(
      calls.some(({ name }) => name === "updateRoleId"),
      true,
    );
  });
  await context.test("reject self role assignment", async () => {
    await assertApplicationError(
      createRoleService().service.changeUserRole(ownerId, ownerId, nextRoleId),
      "forbidden",
    );
  });
  await context.test("reject missing actor assignment", async () => {
    await assertApplicationError(
      createRoleService({ assignments: [{ userId, roleId: customRoleId }] }).service.changeUserRole(
        ownerId,
        userId,
        nextRoleId,
      ),
      "unauthorized",
    );
  });
  await context.test("reject missing target user", async () => {
    await assertApplicationError(
      createRoleService({
        assignments: [{ userId: ownerId, roleId: ownerRoleId }],
      }).service.changeUserRole(ownerId, userId, nextRoleId),
      "not_found",
    );
  });
  await context.test("reject missing target role assignment", async () => {
    await assert.rejects(
      createRoleService({
        assignments: [
          { userId: ownerId, roleId: ownerRoleId },
          { userId, roleId: "missing-role" },
        ],
      }).service.changeUserRole(ownerId, userId, nextRoleId),
      /User role assignment is invalid/,
    );
  });
  await context.test("reject missing selected role", async () => {
    await assertApplicationError(
      createRoleService().service.changeUserRole(ownerId, userId, "unknown"),
      "not_found",
    );
  });
  await context.test("reject role at or above actor level", async () => {
    await assertApplicationError(
      createRoleService().service.changeUserRole(ownerId, userId, ownerRoleId),
      "forbidden",
    );
  });
  await context.test("reject assigning the existing role", async () => {
    await assertApplicationError(
      createRoleService().service.changeUserRole(ownerId, userId, customRoleId),
      "conflict",
    );
  });
});
