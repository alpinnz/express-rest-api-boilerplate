import assert from "node:assert/strict";
import test from "node:test";
import type { Transaction } from "sequelize";
import { User } from "../../src/modules/users/entity/user.entity.js";
import { UserService } from "../../src/modules/users/service/user.service.js";
import { ApplicationError } from "../../src/shared/errors/application-error.js";

const userId = "019a34c0-0000-7000-8000-000000000001";
const roleId = "019a34c0-0000-7000-8000-000000000002";

function createUserService(
  options: { missingIds?: string[]; profileMissing?: boolean; deleteSucceeds?: boolean } = {},
) {
  const now = new Date("2026-10-27T00:00:00.000Z");
  const storedUser = new User({
    id: userId,
    roleId,
    name: "Alfin Noviaji",
    email: "alfin@example.test",
    phone_number: "81234567890",
    country_code: "+62",
    createdAt: now,
    updatedAt: now,
  });
  const calls: Array<{ name: string; arguments: unknown[] }> = [];
  const repository = {
    create: async (...args: unknown[]) => {
      calls.push({ name: "create", arguments: args });
      return args[0] as User;
    },
    findById: async (id: string, ...args: unknown[]) => {
      calls.push({ name: "findById", arguments: [id, ...args] });
      return options.missingIds?.includes(id) ? null : storedUser;
    },
    findProfileById: async (id: string) => {
      calls.push({ name: "findProfileById", arguments: [id] });
      return options.profileMissing
        ? null
        : { user: storedUser, role: { id: roleId, name: "user", level: 10 } };
    },
    findByEmail: async (...args: unknown[]) => {
      calls.push({ name: "findByEmail", arguments: args });
      return storedUser;
    },
    list: async (...args: unknown[]) => {
      calls.push({ name: "list", arguments: args });
      return { items: [storedUser], total: 1 };
    },
    update: async (...args: unknown[]) => {
      calls.push({ name: "update", arguments: args });
      return args[0] as User;
    },
    softDelete: async (...args: unknown[]) => {
      calls.push({ name: "softDelete", arguments: args });
      return options.deleteSucceeds !== false;
    },
    findRoleAssignmentsForUpdate: async (...args: unknown[]) => {
      calls.push({ name: "findRoleAssignmentsForUpdate", arguments: args });
      return [{ userId, roleId }];
    },
    hasUsersWithRole: async (...args: unknown[]) => {
      calls.push({ name: "hasUsersWithRole", arguments: args });
      return true;
    },
    updateRoleId: async (...args: unknown[]) => {
      calls.push({ name: "updateRoleId", arguments: args });
    },
  };
  const service = new UserService(repository, {
    run: async <TResult>(work: (transaction: Transaction) => Promise<TResult>) =>
      work({} as Transaction),
  } as never);
  return { service, calls, storedUser };
}

void test("UserService creates normalized users and delegates read operations", async () => {
  const { service, calls, storedUser } = createUserService();
  const created = await service.create({
    roleId,
    name: "Alfin Noviaji",
    email: "alfin@example.test",
    phone_number: "81234567890",
    country_code: "+62",
  });
  assert.equal(created.name, "Alfin Noviaji");
  assert.match(created.id, /^[0-9a-f-]{36}$/);
  assert.equal((await service.get(userId)).id, storedUser.id);
  assert.equal((await service.getProfileWithRole(userId)).role.name, "user");
  assert.equal((await service.findById(userId))?.id, userId);
  assert.equal((await service.findByEmail("alfin@example.test"))?.id, userId);
  assert.equal((await service.list({ page: 1, limit: 20 })).total, 1);
  assert.equal(
    calls.some(({ name }) => name === "create"),
    true,
  );
  assert.equal(
    calls.some(({ name }) => name === "findByEmail"),
    true,
  );
  assert.equal(
    calls.some(({ name }) => name === "list"),
    true,
  );
});

void test("UserService reports missing profiles and users", async (context) => {
  const missing = createUserService({ missingIds: [userId], profileMissing: true });
  await context.test("user lookup", async () => {
    await assert.rejects(
      missing.service.get(userId),
      (error: unknown) => error instanceof ApplicationError && error.kind === "not_found",
    );
  });
  await context.test("profile lookup", async () => {
    await assert.rejects(
      missing.service.getProfileWithRole(userId),
      (error: unknown) => error instanceof ApplicationError && error.kind === "not_found",
    );
  });
});

void test("UserService update preserves omitted fields and accepts explicit null", async () => {
  const { service, calls } = createUserService();
  const updated = await service.update({ userId, name: "Updated Name", country_code: null });

  assert.equal(updated.name, "Updated Name");
  assert.equal(updated.phone_number, "81234567890");
  assert.equal(updated.country_code, null);
  const updateInput = calls.find(({ name }) => name === "update")?.arguments[0] as User;
  assert.equal(updateInput.email, "alfin@example.test");

  const cleared = await service.update({ userId, phone_number: null, country_code: "+1" });
  assert.equal(cleared.phone_number, null);
  assert.equal(cleared.country_code, "+1");
});

void test("UserService soft delete and role-assignment methods delegate consistently", async () => {
  const { service, calls } = createUserService();
  await service.softDelete(userId);
  assert.deepEqual(await service.findRoleAssignmentsForUpdate([userId], {} as Transaction), [
    { userId, roleId },
  ]);
  assert.equal(await service.hasUsersWithRole(roleId, {} as Transaction), true);
  await service.updateRoleId(userId, "next-role-id", {} as Transaction);
  assert.equal(
    calls.some(({ name }) => name === "softDelete"),
    true,
  );
  assert.equal(
    calls.some(({ name }) => name === "updateRoleId"),
    true,
  );
});

void test("UserService reports when a soft delete no longer matches an active user", async () => {
  const { service } = createUserService({ deleteSucceeds: false });
  await assert.rejects(
    service.softDelete(userId),
    (error: unknown) => error instanceof ApplicationError && error.kind === "not_found",
  );
});
