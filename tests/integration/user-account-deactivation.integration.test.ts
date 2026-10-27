import assert from "node:assert/strict";
import test from "node:test";
import type { Server } from "node:http";
import { QueryTypes } from "sequelize";
import { loadEnvironment } from "../../src/config/environment.js";
import { createDatabase } from "../../src/config/database.js";
import { createDependencyContainer } from "../../src/container.js";
import { createApp } from "../../src/app.js";
import { createMigrator } from "../../src/shared/database/migrator.js";
import { runSeeders } from "../../src/shared/database/seeder-runner.js";

type ApiResponse = {
  code: string;
  data?: Record<string, unknown>;
  errors?: Array<Record<string, unknown>>;
  status?: string;
  checks?: { database: { status: string } };
};

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Response field ${field} must be a string.`);
  return value;
}

void test("owner deactivation soft-deletes credentials and revokes user sessions", async () => {
  const environment = loadEnvironment();
  if (environment.nodeEnv !== "test" || !environment.databaseName.endsWith("_test"))
    throw new Error("Integration tests require NODE_ENV=test and a database name ending in _test.");
  if (!process.env.SEED_DEMO_USER_PASSWORD)
    throw new Error("SEED_DEMO_USER_PASSWORD is required by the test account seeder.");

  const database = createDatabase(environment);
  const container = createDependencyContainer(environment);
  let server: Server | undefined;
  try {
    await database.authenticate();
    await database.query("DROP SCHEMA IF EXISTS public CASCADE");
    await database.query("CREATE SCHEMA public");
    await createMigrator(database).up();
    await runSeeders(database, environment.nodeEnv);

    const app = createApp(container, async () => {
      await container.resolve("database").authenticate();
    });
    server = await new Promise<Server>((resolve) => {
      const listeningServer = app.listen(0, environment.host, () => resolve(listeningServer));
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const baseUrl = `http://${environment.host}:${address.port}`;

    const makeRequest = async (
      path: string,
      options: { method?: string; token?: string; body?: unknown } = {},
    ) => {
      const headers = new Headers({
        accept: "application/json",
        "accept-language": "en",
      });
      if (options.token) headers.set("authorization", `Bearer ${options.token}`);
      if (options.body !== undefined) headers.set("content-type", "application/json");
      const response = await fetch(`${baseUrl}${path}`, {
        method: options.method ?? "GET",
        headers,
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
      return {
        status: response.status,
        body: (await response.json()) as ApiResponse,
      };
    };

    const health = await makeRequest("/api/v1/health");
    assert.equal(health.status, 200);
    assert.deepEqual(health.body, {
      status: "ok",
      checks: { database: { status: "ok" } },
    });

    const registration = await makeRequest("/api/v1/auth/register", {
      method: "POST",
      body: {
        name: "Integration User",
        email: "integration-user@example.test",
        phone_number: "81234567890",
        country_code: "+62",
        password: "!Password123",
        confirm_password: "!Password123",
      },
    });
    assert.equal(registration.status, 201);
    assert.equal(registration.body.code, "created");
    const userId = requireString(registration.body.data?.id, "user.id");

    const regularLogin = await makeRequest("/api/v1/auth/login", {
      method: "POST",
      body: { email: "integration-user@example.test", password: "!Password123" },
    });
    assert.equal(regularLogin.status, 200);
    const regularAccessToken = requireString(regularLogin.body.data?.access_token, "access_token");

    const regularList = await makeRequest("/api/v1/users", { token: regularAccessToken });
    assert.equal(regularList.status, 403);
    assert.equal(regularList.body.code, "forbidden");

    const ownerLogin = await makeRequest("/api/v1/auth/login", {
      method: "POST",
      body: {
        email: "demo-admin@example.test",
        password: process.env.SEED_DEMO_USER_PASSWORD,
      },
    });
    assert.equal(ownerLogin.status, 200);
    const ownerAccessToken = requireString(ownerLogin.body.data?.access_token, "access_token");

    const ownerList = await makeRequest("/api/v1/users", { token: ownerAccessToken });
    assert.equal(ownerList.status, 200);

    const deactivation = await makeRequest(`/api/v1/users/${userId}`, {
      method: "DELETE",
      token: ownerAccessToken,
    });
    assert.equal(deactivation.status, 200);
    assert.equal(deactivation.body.code, "deleted");

    const revokedAccess = await makeRequest("/api/v1/users/me", {
      token: regularAccessToken,
    });
    assert.equal(revokedAccess.status, 401);

    const deletedUsers = await database.query<{ deleted_at: Date | null }>(
      "SELECT deleted_at FROM users WHERE id = :userId",
      { replacements: { userId }, type: QueryTypes.SELECT },
    );
    const deletedCredentials = await database.query<{
      deleted_at: Date | null;
      password_hash: string | null;
    }>("SELECT deleted_at, password_hash FROM auth_credentials WHERE user_id = :userId", {
      replacements: { userId },
      type: QueryTypes.SELECT,
    });
    const revokedSessions = await database.query<{ revoked_at: Date | null }>(
      "SELECT revoked_at FROM auth_sessions WHERE user_id = :userId",
      { replacements: { userId }, type: QueryTypes.SELECT },
    );
    assert.ok(deletedUsers[0]?.deleted_at);
    assert.ok(deletedCredentials[0]?.deleted_at);
    assert.equal(deletedCredentials[0]?.password_hash, null);
    assert.ok(revokedSessions[0]?.revoked_at);
  } finally {
    try {
      const integrationServer = server;
      if (integrationServer) {
        await new Promise<void>((resolve, reject) => {
          integrationServer.close((error) => (error ? reject(error) : resolve()));
        });
      }
    } finally {
      try {
        await container.dispose();
      } finally {
        await database.close();
      }
    }
  }
});
