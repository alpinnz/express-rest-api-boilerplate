import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Umzug, SequelizeStorage } from "umzug";
import type { Sequelize } from "sequelize";
import type { MigrationContext, MigrationModule } from "./migration.type.js";

export function normalizeMigrationName(name: string): string {
  return name.replace(/\.(ts|js)$/, "");
}
export function createMigrator(database: Sequelize) {
  const directory = fileURLToPath(new URL("../../../migrations/", import.meta.url));
  const extension = import.meta.url.endsWith(".ts") ? "ts" : "js";
  return new Umzug<MigrationContext>({
    context: { database, queryInterface: database.getQueryInterface() },
    migrations: {
      glob: ["*." + extension, { cwd: directory }],
      resolve: ({ name, path: migrationPath, context }) => {
        if (!migrationPath) throw new Error("Missing migration path");
        const load = async () =>
          (await import(pathToFileURL(path.resolve(migrationPath)).href)) as MigrationModule;
        const stableName = normalizeMigrationName(name);
        const arguments_ = { name: stableName, path: migrationPath, context };
        return {
          name: stableName,
          up: async () => (await load()).up(arguments_),
          down: async () => (await load()).down(arguments_),
        };
      },
    },
    storage: new SequelizeStorage({
      sequelize: database,
      modelName: "SchemaMigration",
      tableName: "schema_migrations",
      columnName: "name",
    }),
    logger: undefined,
  });
}
