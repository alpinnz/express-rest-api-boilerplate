import assert from "node:assert/strict";
import test from "node:test";
import { HealthService } from "../../src/modules/health/service/health.service.js";

void test("health service reports a healthy database after a successful probe", async () => {
  const service = new HealthService({ authenticate: async () => undefined } as never);
  assert.deepEqual(await service.getHealthStatus(), {
    status: "ok",
    checks: { database: { status: "ok" } },
  });
});

void test("health service reports dependency failure without leaking database details", async () => {
  const service = new HealthService({
    authenticate: async () => {
      throw new Error("private connection details");
    },
  } as never);
  assert.deepEqual(await service.getHealthStatus(), {
    status: "error",
    checks: { database: { status: "error" } },
  });
});
