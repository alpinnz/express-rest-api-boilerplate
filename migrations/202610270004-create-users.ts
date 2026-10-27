import { DataTypes } from "sequelize";
import type { MigrationArguments } from "../src/shared/database/migration.type.js";

export async function up({ context }: MigrationArguments): Promise<void> {
  await context.database.transaction(async (transaction) => {
    await context.queryInterface.createTable(
      "users",
      {
        id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
        role_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "roles", key: "id" },
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
        },
        name: { type: DataTypes.STRING(100), allowNull: false },
        email: { type: DataTypes.STRING(254), allowNull: false },
        phone_number: { type: DataTypes.STRING(20), allowNull: true },
        country_code: { type: DataTypes.STRING(5), allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
      },
      { transaction },
    );
    await context.queryInterface.addConstraint("users", {
      fields: ["email"],
      type: "unique",
      name: "users_email_key",
      transaction,
    });
    await context.database.query(
      "ALTER TABLE users ADD CONSTRAINT users_name_check CHECK (char_length(btrim(name)) BETWEEN 1 AND 100), ADD CONSTRAINT users_email_normalized_check CHECK (email = lower(btrim(email)))",
      { transaction },
    );
    await context.queryInterface.addIndex("users", ["role_id"], {
      name: "users_role_id_idx",
      transaction,
    });
  });
}

export async function down({ context }: MigrationArguments): Promise<void> {
  await context.database.transaction(async (transaction) => {
    await context.queryInterface.dropTable("users", { transaction });
  });
}
