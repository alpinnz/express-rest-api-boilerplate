#!/usr/bin/env node
import pg from "pg";
import { QueryTypes } from "sequelize";
import { loadEnvironment } from "../src/config/environment.js";
import { createDatabase, createPgConfig } from "../src/config/database.js";
import { createMigrator } from "../src/shared/database/migrator.js";

const environment = loadEnvironment();
const command = process.argv[2] ?? "up";
if (!["up", "down", "pending"].includes(command))
  throw new Error("Migration command must be up, down or pending");
if (command === "down" && environment.nodeEnv === "production")
  throw new Error("Production requires a reviewed forward-fix migration");
const database = createDatabase(environment);
// A dedicated CLI connection holds a session advisory lock; no extra application pool.
const lockClient = new pg.Client(createPgConfig(environment));
try {
  await lockClient.connect();
  const result = await lockClient.query<{ locked: boolean }>(
    "SELECT pg_try_advisory_lock($1) AS locked",
    [73291461],
  );
  if (!result.rows[0]?.locked) throw new Error("Another migration runner holds the lock");
  const migrator = createMigrator(database);
  await assertMigrationHistoryMatchesSource(database, migrator);
  const migrations =
    command === "up"
      ? await migrator.up()
      : command === "down"
        ? await migrator.down({ step: 1 })
        : await migrator.pending();
  console.log(migrations.map((migration) => migration.name));
} finally {
  // Closing this session also releases its advisory lock, including error paths.
  try {
    await lockClient.end();
  } finally {
    await database.close();
  }
}

async function assertMigrationHistoryMatchesSource(
  database: ReturnType<typeof createDatabase>,
  migrator: ReturnType<typeof createMigrator>,
): Promise<void> {
  const tables = await database.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    { type: QueryTypes.SELECT },
  );
  const tableNames = new Set(tables.map(({ tablename }) => tablename));
  const historyExists = tableNames.has("schema_migrations");
  const history = historyExists
    ? await database.query<{ name: string }>("SELECT name FROM schema_migrations", {
        type: QueryTypes.SELECT,
      })
    : [];
  const availableNames = new Set(
    (await migrator.migrations({ database, queryInterface: database.getQueryInterface() })).map(
      ({ name }) => name,
    ),
  );
  const unknownHistory = history
    .map(({ name }) => name)
    .filter((name) => !availableNames.has(name));
  const applicationTables = [...tableNames].filter((name) => name !== "schema_migrations");

  if (unknownHistory.length || (!history.length && applicationTables.length)) {
    throw new Error(
      "Database schema or migration history does not match this baseline. Preserve existing data with a reviewed forward migration; only development/test databases may use db:refresh.",
    );
  }
}
