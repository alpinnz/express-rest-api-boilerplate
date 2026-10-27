import { DataTypes } from "sequelize";
import type { MigrationArguments } from "../src/shared/database/migration.type.js";

export async function up({ context }: MigrationArguments): Promise<void> {
  await context.database.transaction(async (transaction) => {
    await context.queryInterface.createTable(
      "roles",
      {
        id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        name: { type: DataTypes.STRING(50), allowNull: false },
        level: { type: DataTypes.INTEGER, allowNull: false },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      },
      { transaction },
    );
    await context.queryInterface.addConstraint("roles", {
      fields: ["name"],
      type: "unique",
      name: "roles_name_key",
      transaction,
    });
    await context.database.query(
      "ALTER TABLE roles ADD CONSTRAINT roles_level_check CHECK (level > 0)",
      {
        transaction,
      },
    );
  });
}

export async function down({ context }: MigrationArguments): Promise<void> {
  await context.database.transaction(async (transaction) => {
    await context.queryInterface.dropTable("roles", { transaction });
  });
}
