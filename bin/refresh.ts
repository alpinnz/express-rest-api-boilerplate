#!/usr/bin/env node
import pg from "pg";
import { loadEnvironment } from "../src/config/environment.js";
import { createDatabase, createPgConfig } from "../src/config/database.js";
import { createMigrator } from "../src/shared/database/migrator.js";
import { runSeeders } from "../src/shared/database/seeder-runner.js";

const environment = loadEnvironment();
if (environment.nodeEnv !== "development" && environment.nodeEnv !== "test")
  throw new Error("Database refresh is allowed only in development or test environments");

const database = createDatabase(environment);
const lockClient = new pg.Client(createPgConfig(environment));
try {
  await lockClient.connect();
  const result = await lockClient.query<{ locked: boolean }>(
    "SELECT pg_try_advisory_lock($1) AS locked",
    [73291461],
  );
  if (!result.rows[0]?.locked) throw new Error("Another migration or seeder runner holds the lock");

  console.warn(
    `Refreshing ${environment.nodeEnv} database "${environment.databaseName}": all public schema objects will be dropped.`,
  );
  await database.transaction(async (transaction) => {
    await database.query("DROP SCHEMA IF EXISTS public CASCADE", { transaction });
    await database.query("CREATE SCHEMA public", { transaction });
  });

  const migrations = await createMigrator(database).up();
  const seeders = await runSeeders(database, environment.nodeEnv);
  console.log({ migrations: migrations.map(({ name }) => name), seeders });
} finally {
  try {
    await lockClient.end();
  } finally {
    await database.close();
  }
}
