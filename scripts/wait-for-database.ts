import { setTimeout } from "node:timers/promises";
import pg from "pg";
import { loadEnvironment } from "../src/config/environment.js";
import { createPgConfig } from "../src/config/database.js";

const environment = loadEnvironment();
if (environment.nodeEnv !== "test" || !environment.databaseName.endsWith("_test")) {
  throw new Error("Database readiness check requires a dedicated test environment");
}
const deadline = Date.now() + 30000;
let ready = false;
while (Date.now() < deadline) {
  const client = new pg.Client({ ...createPgConfig(environment), connectionTimeoutMillis: 1000 });
  try {
    await client.connect();
    await client.query("SELECT 1");
    ready = true;
  } catch {
    // Retry without printing driver errors, connection strings, or credentials.
  } finally {
    await client.end().catch(() => undefined);
  }
  if (ready) break;
  await setTimeout(500);
}
if (!ready) throw new Error("PostgreSQL test database was not ready within 30 seconds");
console.log("PostgreSQL test database is ready");
