import { DataTypes } from "sequelize";
import type { MigrationArguments } from "../src/shared/database/migration.type.js";

export async function up({ context }: MigrationArguments): Promise<void> {
  await context.database.transaction(async (transaction) => {
    await context.queryInterface.createTable(
      "auth_sessions",
      {
        id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
        access_token_hash: { type: DataTypes.STRING(64), allowNull: false },
        refresh_token_hash: { type: DataTypes.STRING(64), allowNull: false },
        access_expires_at: { type: DataTypes.DATE, allowNull: false },
        refresh_expires_at: { type: DataTypes.DATE, allowNull: false },
        revoked_at: { type: DataTypes.DATE, allowNull: true },
        remember_me: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      },
      { transaction },
    );
    await context.queryInterface.addIndex("auth_sessions", ["access_token_hash"], {
      name: "auth_sessions_access_token_hash_key",
      unique: true,
      transaction,
    });
    await context.queryInterface.addIndex("auth_sessions", ["refresh_token_hash"], {
      name: "auth_sessions_refresh_token_hash_key",
      unique: true,
      transaction,
    });
    await context.queryInterface.addIndex("auth_sessions", ["user_id"], {
      name: "auth_sessions_user_id_idx",
      transaction,
    });
  });
}

export async function down({ context }: MigrationArguments): Promise<void> {
  await context.database.transaction(async (transaction) => {
    await context.queryInterface.dropTable("auth_sessions", { transaction });
  });
}
