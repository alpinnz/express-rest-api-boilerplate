import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import type { Server } from "node:http";
import type { Logger } from "pino";
import { User } from "../../src/modules/users/entity/user.entity.js";
import { UserController } from "../../src/modules/users/controller/user.controller.js";
import type { UserServiceApi } from "../../src/modules/users/service/user-service.type.js";
import type { AuthenticatedUserAccountServiceApi } from "../../src/modules/users/service/authenticated-user-account-service.type.js";
import { requireAuthentication } from "../../src/modules/auth/middleware/require-authentication.middleware.js";
import { requireMinimumRoleLevel } from "../../src/modules/roles/middleware/require-minimum-role-level.middleware.js";
import {
  ADMIN_ROLE_LEVEL,
  OWNER_ROLE_LEVEL,
} from "../../src/modules/roles/entity/system-role-catalog.js";
import { createUserRouter } from "../../src/modules/users/routes/user.routes.js";
import { createErrorMiddleware } from "../../src/shared/http/error.middleware.js";
import type { RequestContext } from "../../src/shared/http/http.type.js";

const ownerId = "019a34c0-0000-7000-8000-000000000001";
const adminId = "019a34c0-0000-7000-8000-000000000002";
const userId = "019a34c0-0000-7000-8000-000000000003";
const accessTokens = new Map([
  ["O".repeat(43), ownerId],
  ["A".repeat(43), adminId],
  ["U".repeat(43), userId],
]);
const profiles = new Map([
  [ownerId, { id: ownerId, level: OWNER_ROLE_LEVEL }],
  [adminId, { id: adminId, level: ADMIN_ROLE_LEVEL }],
  [userId, { id: userId, level: 10 }],
]);

async function createTestServer() {
  let deactivatedUserId: string | null = null;
  const targetUser = new User({
    id: userId,
    roleId: "019a34c0-0000-7000-8000-000000000004",
    name: "Target User",
    email: "target@example.test",
    phone_number: null,
    country_code: null,
    createdAt: new Date("2026-10-27T00:00:00.000Z"),
    updatedAt: new Date("2026-10-27T00:00:00.000Z"),
  });
  const userService = {
    getProfileWithRole: async (id: string) => {
      const actor = profiles.get(id);
      if (!actor) throw new Error("Missing actor profile");
      return {
        user: targetUser,
        role: { id: actor.id, name: "test", level: actor.level },
      };
    },
    list: async () => ({ items: [], total: 0 }),
    get: async () => targetUser,
    update: async () => targetUser,
  } as unknown as UserServiceApi;
  const accountService = {
    changePassword: async () => undefined,
    deactivateAccount: async () => undefined,
    deactivateAccountByAdministrator: async (id: string) => {
      deactivatedUserId = id;
    },
  } as AuthenticatedUserAccountServiceApi;
  const userController = new UserController(userService, accountService);
  const root = express();
  root.use(express.json());
  root.use((_request, response, next) => {
    const requestContext: RequestContext = {
      requestId: "019a34c0-0000-7000-8000-000000000010",
      authenticatedUserId: null,
      validated: {},
      scope: {
        resolve(token: string) {
          if (token === "authService")
            return {
              findActiveUserIdByAccessToken: async (tokenValue: string) =>
                accessTokens.get(tokenValue) ?? null,
            };
          if (token === "userService") return userService;
          if (token === "userController") return userController;
          throw new Error(`Unexpected dependency: ${token}`);
        },
      } as never,
    };
    response.locals.requestContext = requestContext;
    response.locals.localization = {
      locale: "en",
      translate: (key: string) => key,
    };
    next();
  });
  root.use(
    "/users",
    createUserRouter(
      requireAuthentication,
      requireMinimumRoleLevel(ADMIN_ROLE_LEVEL),
      requireMinimumRoleLevel(OWNER_ROLE_LEVEL),
    ),
  );
  root.use(createErrorMiddleware({ error: () => undefined } as unknown as Logger));

  const server = await new Promise<Server>((resolve) => {
    const listeningServer = root.listen(0, "127.0.0.1", () => resolve(listeningServer));
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}/users`,
    getDeactivatedUserId: () => deactivatedUserId,
  };
}

async function getJsonResponse(url: string, token?: string, method = "GET", body?: unknown) {
  const headers = new Headers({ accept: "application/json" });
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (body) headers.set("content-type", "application/json");
  const response = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { response, body: (await response.json()) as Record<string, unknown> };
}

void test("User collection requires authentication and an admin role to read", async (context) => {
  const app = await createTestServer();
  context.after(async () => {
    await new Promise<void>((resolve, reject) => {
      app.server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  const anonymous = await getJsonResponse(app.baseUrl);
  assert.equal(anonymous.response.status, 401);
  assert.equal(anonymous.body.code, "unauthorized");

  const regularUser = await getJsonResponse(app.baseUrl, "U".repeat(43));
  assert.equal(regularUser.response.status, 403);
  assert.equal(regularUser.body.code, "forbidden");

  const admin = await getJsonResponse(app.baseUrl, "A".repeat(43));
  assert.equal(admin.response.status, 200);
  assert.equal(admin.body.code, "success");

  const adminDetail = await getJsonResponse(`${app.baseUrl}/${userId}`, "A".repeat(43));
  assert.equal(adminDetail.response.status, 200);
  assert.equal(adminDetail.body.code, "success");
});

void test("User ID writes require owner and cannot target the authenticated owner", async (context) => {
  const app = await createTestServer();
  context.after(async () => {
    await new Promise<void>((resolve, reject) => {
      app.server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  const adminWrite = await getJsonResponse(`${app.baseUrl}/${userId}`, "A".repeat(43), "DELETE");
  assert.equal(adminWrite.response.status, 403);
  const adminUpdate = await getJsonResponse(`${app.baseUrl}/${userId}`, "A".repeat(43), "PUT", {
    name: "Changed Name",
  });
  assert.equal(adminUpdate.response.status, 403);

  const selfWrite = await getJsonResponse(`${app.baseUrl}/${ownerId}`, "O".repeat(43), "DELETE");
  assert.equal(selfWrite.response.status, 403);
  assert.deepEqual(selfWrite.body.errors, [
    {
      field: "user_id",
      location: "path",
      code: "self_user_management_forbidden",
      message: "common.selfUserManagementForbidden",
    },
  ]);
  assert.equal(app.getDeactivatedUserId(), null);

  const selfUpdate = await getJsonResponse(`${app.baseUrl}/${ownerId}`, "O".repeat(43), "PUT", {
    name: "Changed Name",
  });
  assert.equal(selfUpdate.response.status, 403);
  assert.equal(app.getDeactivatedUserId(), null);

  const ownerUpdate = await getJsonResponse(`${app.baseUrl}/${userId}`, "O".repeat(43), "PUT", {
    name: "Changed Name",
  });
  assert.equal(ownerUpdate.response.status, 200);

  const ownerDelete = await getJsonResponse(`${app.baseUrl}/${userId}`, "O".repeat(43), "DELETE");
  assert.equal(ownerDelete.response.status, 200);
  assert.equal(app.getDeactivatedUserId(), userId);
});
