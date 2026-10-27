import { DataTypes } from "sequelize";
import type { MigrationArguments } from "../src/shared/database/migration.type.js";

export async function up({ context }: MigrationArguments): Promise<void> {
  await context.database.transaction(async (transaction) => {
    await context.queryInterface.createTable(
      "auth_credentials",
      {
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          references: { model: "users", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
        password_hash: { type: DataTypes.TEXT, allowNull: true },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
      },
      { transaction },
    );
    await context.database.query(
      "ALTER TABLE auth_credentials ADD CONSTRAINT auth_credentials_deleted_hash_check CHECK ((deleted_at IS NULL AND password_hash IS NOT NULL) OR (deleted_at IS NOT NULL AND password_hash IS NULL))",
      { transaction },
    );
  });
}

export async function down({ context }: MigrationArguments): Promise<void> {
  await context.database.transaction(async (transaction) => {
    await context.queryInterface.dropTable("auth_credentials", { transaction });
  });
}
