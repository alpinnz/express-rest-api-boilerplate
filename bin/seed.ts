#!/usr/bin/env node
import pg from "pg";
import { loadEnvironment } from "../src/config/environment.js";
import { createDatabase, createPgConfig } from "../src/config/database.js";
import { runSeeders } from "../src/shared/database/seeder-runner.js";

const environment = loadEnvironment();
const database = createDatabase(environment);
const lockClient = new pg.Client(createPgConfig(environment));
try {
  await lockClient.connect();
  const result = await lockClient.query<{ locked: boolean }>(
    "SELECT pg_try_advisory_lock($1) AS locked",
    [73291461],
  );
  if (!result.rows[0]?.locked) throw new Error("Another migration or seeder runner holds the lock");

  const seeders = await runSeeders(database, environment.nodeEnv);
  console.log(seeders);
} finally {
  try {
    await lockClient.end();
  } finally {
    await database.close();
  }
}
