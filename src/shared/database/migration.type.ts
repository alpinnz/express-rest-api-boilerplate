import type { QueryInterface, Sequelize } from "sequelize";
import type { MigrationParams } from "umzug";
export type MigrationContext = { database: Sequelize; queryInterface: QueryInterface };
export type MigrationArguments = MigrationParams<MigrationContext>;
export type MigrationModule = {
  up: (arguments_: MigrationArguments) => Promise<unknown>;
  down: (arguments_: MigrationArguments) => Promise<unknown>;
};
