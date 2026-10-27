import assert from "node:assert/strict";
import test from "node:test";
import type { Transaction } from "sequelize";
import { AuthService } from "../../src/modules/auth/service/auth.service.js";
import { ApplicationError } from "../../src/shared/errors/application-error.js";

const userId = "019a34c0-0000-7000-8000-000000000001";

function createAuthService(options: { passwordHash: string | null; userExists: boolean }) {
  const transaction = {} as Transaction;
  const calls: string[] = [];
  const service = new AuthService(
    {
      findById: async (id: string) => {
        calls.push(`findById:${id}`);
        return options.userExists ? ({ id } as never) : null;
      },
      softDelete: async (id: string) => {
        calls.push(`softDeleteUser:${id}`);
      },
    } as never,
    {} as never,
    {
      findPasswordHashByUserIdForUpdate: async (id: string) => {
        calls.push(`lockCredential:${id}`);
        return options.passwordHash;
      },
      softDeleteByUserId: async (id: string) => {
        calls.push(`softDeleteCredential:${id}`);
      },
    } as never,
    {
      revokeAllByUserId: async (id: string) => {
        calls.push(`revokeSessions:${id}`);
      },
    } as never,
    {
      run: async <TResult>(work: (activeTransaction: Transaction) => Promise<TResult>) =>
        work(transaction),
    } as never,
    {} as never,
    {} as never,
  );
  return { service, calls };
}

void test("administrator deactivation soft-deletes account data and revokes sessions atomically", async () => {
  const { service, calls } = createAuthService({ passwordHash: "stored-hash", userExists: true });

  await service.deactivateAccountByAdministrator(userId);

  assert.deepEqual(calls, [
    `lockCredential:${userId}`,
    `findById:${userId}`,
    `softDeleteUser:${userId}`,
    `softDeleteCredential:${userId}`,
    `revokeSessions:${userId}`,
  ]);
});

void test("administrator deactivation supports a profile without an active credential", async () => {
  const { service, calls } = createAuthService({ passwordHash: null, userExists: true });

  await service.deactivateAccountByAdministrator(userId);

  assert.equal(calls.includes(`softDeleteCredential:${userId}`), false);
  assert.equal(calls.includes(`revokeSessions:${userId}`), true);
});

void test("administrator deactivation reports a missing user without mutating related rows", async () => {
  const { service, calls } = createAuthService({ passwordHash: null, userExists: false });

  await assert.rejects(service.deactivateAccountByAdministrator(userId), (error: unknown) => {
    assert.ok(error instanceof ApplicationError);
    assert.equal(error.kind, "not_found");
    assert.deepEqual(error.details, [
      {
        field: "user_id",
        location: "path",
        code: "user_not_found",
        messageKey: "common.notFound",
      },
    ]);
    return true;
  });
  assert.deepEqual(calls, [`lockCredential:${userId}`, `findById:${userId}`]);
});
