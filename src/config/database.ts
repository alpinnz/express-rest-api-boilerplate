import pg from "pg";
import type { ClientConfig } from "pg";
import { Sequelize } from "sequelize";
import type { Environment } from "./environment.type.js";

export function createPgConfig(environment: Environment): ClientConfig {
  return {
    host: environment.databaseHost,
    port: environment.databasePort,
    database: environment.databaseName,
    user: environment.databaseUser,
    password: environment.databasePass,
    ssl: environment.databaseSsl ? { rejectUnauthorized: true } : false,
    application_name: "express-rest-api-boilerplate",
    statement_timeout: 10000,
    connectionTimeoutMillis: 5000,
  };
}
export function createDatabase(environment: Environment): Sequelize {
  return new Sequelize(
    environment.databaseName,
    environment.databaseUser,
    environment.databasePass,
    {
      dialect: "postgres",
      dialectModule: pg,
      host: environment.databaseHost,
      port: environment.databasePort,
      dialectOptions: createPgConfig(environment),
      logging: false,
      pool: { max: environment.databasePoolMax, min: 0, acquire: 10000, idle: 30000 },
      define: { timestamps: true, underscored: true },
    },
  );
}
