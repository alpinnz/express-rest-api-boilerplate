import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import type { Transaction } from "sequelize";
import { AuthValidationError } from "../../src/modules/auth/errors/auth.error.js";
import { AuthService } from "../../src/modules/auth/service/auth.service.js";
import type { AuthSession } from "../../src/modules/auth/types/auth-session.type.js";
import { ApplicationError } from "../../src/shared/errors/application-error.js";

const userId = "019a34c0-0000-7000-8000-000000000001";
const password = "!Password123";
const passwordHash = `hash:${password}`;

type AuthServiceOptions = {
  userExists?: boolean;
  loginUser?: { id: string } | null;
  passwordHash?: string | null;
  lockedPasswordHash?: string | null;
  passwordVerificationSucceeds?: boolean;
  passwordUpdateSucceeds?: boolean;
  activeAccessTokenUserId?: string | null;
  refreshSession?: AuthSession | null;
  refreshRotationSucceeds?: boolean;
};

function createActiveSession(): AuthSession {
  const now = new Date("2026-10-27T00:00:00.000Z");
  return {
    id: "019a34c0-0000-7000-8000-000000000020",
    userId,
    accessTokenHash: "old-access-hash",
    refreshTokenHash: "old-refresh-hash",
    accessExpiresAt: new Date(now.getTime() + 60_000),
    refreshExpiresAt: new Date(now.getTime() + 86_400_000),
    rememberMe: true,
    revokedAt: null,
  };
}

function createAuthService(options: AuthServiceOptions = {}) {
  const calls: Array<{ name: string; arguments: unknown[] }> = [];
  const transaction = {} as Transaction;
  const getPasswordHash = () => options.passwordHash ?? passwordHash;
  const getLockedPasswordHash = () =>
    Object.hasOwn(options, "lockedPasswordHash") ? options.lockedPasswordHash! : getPasswordHash();
  const service = new AuthService(
    {
      create: async (input: unknown, activeTransaction: Transaction) => {
        calls.push({ name: "user.create", arguments: [input, activeTransaction] });
        return { id: userId } as never;
      },
      findByEmail: async (...args: unknown[]) => {
        calls.push({ name: "user.findByEmail", arguments: args });
        return Object.hasOwn(options, "loginUser") ? options.loginUser! : { id: userId };
      },
      findById: async (...args: unknown[]) => {
        calls.push({ name: "user.findById", arguments: args });
        return options.userExists === false ? null : ({ id: userId } as never);
      },
      softDelete: async (...args: unknown[]) => {
        calls.push({ name: "user.softDelete", arguments: args });
      },
    } as never,
    {
      getDefaultRoleId: async (...args: unknown[]) => {
        calls.push({ name: "role.getDefaultRoleId", arguments: args });
        return "role-user-id";
      },
    } as never,
    {
      create: async (...args: unknown[]) => {
        calls.push({ name: "credential.create", arguments: args });
      },
      findPasswordHashByUserId: async (...args: unknown[]) => {
        calls.push({ name: "credential.findHash", arguments: args });
        return Object.hasOwn(options, "passwordHash") ? options.passwordHash! : passwordHash;
      },
      findPasswordHashByUserIdForUpdate: async (...args: unknown[]) => {
        calls.push({ name: "credential.lockHash", arguments: args });
        return getLockedPasswordHash();
      },
      updatePasswordHash: async (...args: unknown[]) => {
        calls.push({ name: "credential.updateHash", arguments: args });
        return options.passwordUpdateSucceeds !== false;
      },
      softDeleteByUserId: async (...args: unknown[]) => {
        calls.push({ name: "credential.softDelete", arguments: args });
      },
    },
    {
      create: async (...args: unknown[]) => {
        calls.push({ name: "session.create", arguments: args });
      },
      findActiveUserIdByAccessTokenHash: async (...args: unknown[]) => {
        calls.push({ name: "session.findUserByAccessHash", arguments: args });
        return Object.hasOwn(options, "activeAccessTokenUserId")
          ? options.activeAccessTokenUserId!
          : userId;
      },
      findActiveByRefreshTokenHash: async (...args: unknown[]) => {
        calls.push({ name: "session.findByRefreshHash", arguments: args });
        return Object.hasOwn(options, "refreshSession")
          ? options.refreshSession!
          : createActiveSession();
      },
      rotate: async (...args: unknown[]) => {
        calls.push({ name: "session.rotate", arguments: args });
        return options.refreshRotationSucceeds !== false;
      },
      revokeByRefreshTokenHash: async (...args: unknown[]) => {
        calls.push({ name: "session.revokeByRefreshHash", arguments: args });
      },
      revokeAllByUserId: async (...args: unknown[]) => {
        calls.push({ name: "session.revokeAll", arguments: args });
      },
    },
    {
      run: async <TResult>(work: (activeTransaction: Transaction) => Promise<TResult>) =>
        work(transaction),
    } as never,
    {
      hash: async (plainText: string) => {
        calls.push({ name: "password.hash", arguments: [plainText] });
        return `hash:${plainText}`;
      },
      verify: async (...args: unknown[]) => {
        calls.push({ name: "password.verify", arguments: args });
        return options.passwordVerificationSucceeds !== false;
      },
    },
    {
      authAccessTokenTtlSeconds: 900,
      authRefreshTokenTtlSeconds: 86_400,
      authRememberMeRefreshTokenTtlSeconds: 604_800,
    } as never,
  );
  return { service, calls };
}

async function assertAuthValidation(promise: Promise<unknown>): Promise<void> {
  await assert.rejects(promise, (error: unknown) => error instanceof AuthValidationError);
}

void test("registration creates profile and password credential in one transaction", async () => {
  const { service, calls } = createAuthService();
  const result = await service.register({
    name: "Alfin Noviaji",
    email: "alfin@example.test",
    phone_number: "81234567890",
    country_code: "+62",
    password,
  });

  assert.deepEqual(result, { id: userId });
  assert.deepEqual(calls.find(({ name }) => name === "user.create")?.arguments[0], {
    roleId: "role-user-id",
    name: "Alfin Noviaji",
    email: "alfin@example.test",
    phone_number: "81234567890",
    country_code: "+62",
  });
  assert.equal(
    calls.some(({ name }) => name === "credential.create"),
    true,
  );
});

void test("login creates opaque tokens and uses the selected refresh lifetime", async (context) => {
  for (const rememberMe of [false, true]) {
    await context.test(`remember_me=${rememberMe}`, async () => {
      const { service, calls } = createAuthService();
      const tokens = await service.login({
        email: "alfin@example.test",
        password,
        remember_me: rememberMe,
      });

      assert.equal(tokens.token_type, "Bearer");
      assert.equal(tokens.expires_in, 900);
      assert.equal(tokens.refresh_expires_in, rememberMe ? 604_800 : 86_400);
      assert.equal(tokens.user.id, userId);
      assert.match(tokens.access_token, /^[A-Za-z0-9_-]{43}$/);
      assert.match(tokens.refresh_token, /^[A-Za-z0-9_-]{43}$/);
      const storedSession = calls.find(({ name }) => name === "session.create")
        ?.arguments[0] as AuthSession;
      assert.equal(storedSession.rememberMe, rememberMe);
      assert.equal(
        storedSession.accessTokenHash,
        createHash("sha256").update(tokens.access_token).digest("hex"),
      );
      assert.equal(
        storedSession.refreshTokenHash,
        createHash("sha256").update(tokens.refresh_token).digest("hex"),
      );
    });
  }
});

void test("login rejects missing users, missing credentials, wrong passwords, and stale credentials", async (context) => {
  const cases: Array<[string, AuthServiceOptions]> = [
    ["unknown email", { loginUser: null }],
    ["missing credential", { passwordHash: null }],
    ["wrong password", { passwordVerificationSucceeds: false }],
    ["credential changed during login", { lockedPasswordHash: "new-hash" }],
    ["user deactivated during login", { userExists: false }],
  ];
  for (const [label, options] of cases) {
    await context.test(label, async () => {
      const { service } = createAuthService(options);
      await assertAuthValidation(
        service.login({ email: "alfin@example.test", password, remember_me: false }),
      );
    });
  }
});

void test("password change updates the credential and revokes existing sessions", async () => {
  const { service, calls } = createAuthService();
  await service.changePassword(userId, password, "!NewPassword123");

  assert.equal(
    calls.some(({ name }) => name === "credential.updateHash"),
    true,
  );
  assert.equal(
    calls.some(({ name }) => name === "session.revokeAll"),
    true,
  );
});

void test("password change rejects stale password state and missing users", async (context) => {
  const cases: Array<[string, AuthServiceOptions, string]> = [
    ["credential changed before lock", { lockedPasswordHash: "different-hash" }, "validation"],
    ["user is missing", { userExists: false }, "not_found"],
    ["credential update did not affect a row", { passwordUpdateSucceeds: false }, "validation"],
  ];
  for (const [label, options, kind] of cases) {
    await context.test(label, async () => {
      const { service } = createAuthService(options);
      await assert.rejects(
        service.changePassword(userId, password, "!NewPassword123"),
        (error: unknown) => {
          if (kind === "not_found") return error instanceof ApplicationError && error.kind === kind;
          return error instanceof AuthValidationError;
        },
      );
    });
  }
  await assertAuthValidation(
    createAuthService({ passwordVerificationSucceeds: false }).service.changePassword(
      userId,
      "wrong",
      "!NewPassword123",
    ),
  );
});

void test("account deactivation removes credentials and revokes sessions", async () => {
  const { service, calls } = createAuthService();
  await service.deactivateAccount(userId, password);

  assert.equal(
    calls.some(({ name }) => name === "user.softDelete"),
    true,
  );
  assert.equal(
    calls.some(({ name }) => name === "credential.softDelete"),
    true,
  );
  assert.equal(
    calls.some(({ name }) => name === "session.revokeAll"),
    true,
  );
});

void test("account deactivation rejects bad password, concurrent credential update, and missing user", async (context) => {
  await assertAuthValidation(
    createAuthService({ passwordVerificationSucceeds: false }).service.deactivateAccount(
      userId,
      "wrong",
    ),
  );
  const cases: Array<[string, AuthServiceOptions, "validation" | "not_found"]> = [
    ["credential changed before lock", { lockedPasswordHash: "different-hash" }, "validation"],
    ["user is missing", { userExists: false }, "not_found"],
  ];
  for (const [label, options, kind] of cases) {
    await context.test(label, async () => {
      const { service } = createAuthService(options);
      await assert.rejects(service.deactivateAccount(userId, password), (error: unknown) =>
        kind === "not_found"
          ? error instanceof ApplicationError && error.kind === kind
          : error instanceof AuthValidationError,
      );
    });
  }
});

void test("access token lookup requires an active associated user", async () => {
  const active = createAuthService();
  assert.equal(await active.service.findActiveUserIdByAccessToken("access-token"), userId);

  const noSession = createAuthService({ activeAccessTokenUserId: null });
  assert.equal(await noSession.service.findActiveUserIdByAccessToken("access-token"), null);

  const deletedUser = createAuthService({ userExists: false });
  assert.equal(await deletedUser.service.findActiveUserIdByAccessToken("access-token"), null);
  assert.equal(
    deletedUser.calls.some(({ name }) => name === "user.findById"),
    true,
  );
});

void test("refresh rotates both tokens and keeps remember-me lifetime", async () => {
  const { service, calls } = createAuthService();
  const tokens = await service.refreshToken("old-refresh-token");

  assert.equal(tokens.refresh_expires_in, 604_800);
  assert.equal(tokens.user.id, userId);
  assert.equal(
    calls.some(({ name }) => name === "session.rotate"),
    true,
  );
});

void test("refresh rejects inactive, deactivated, or concurrently rotated sessions", async (context) => {
  const cases: Array<[string, AuthServiceOptions]> = [
    ["unknown refresh token", { refreshSession: null }],
    ["deactivated user", { userExists: false }],
    ["concurrently rotated token", { refreshRotationSucceeds: false }],
  ];
  for (const [label, options] of cases) {
    await context.test(label, async () => {
      const { service } = createAuthService(options);
      await assertAuthValidation(service.refreshToken("old-refresh-token"));
    });
  }
});

void test("logout revokes by a one-way hash of the supplied refresh token", async () => {
  const { service, calls } = createAuthService();
  await service.logout("refresh-token-value");
  const [storedHash] = calls.find(({ name }) => name === "session.revokeByRefreshHash")!.arguments;

  assert.equal(storedHash, createHash("sha256").update("refresh-token-value").digest("hex"));
});
