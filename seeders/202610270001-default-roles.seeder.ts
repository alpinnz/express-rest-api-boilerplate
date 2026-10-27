import { QueryTypes } from "sequelize";
import type { SeederArguments } from "../src/shared/database/seeder.type.js";
import { SYSTEM_ROLES } from "../src/modules/roles/entity/system-role-catalog.js";

type PersistedRole = { id: string; name: string; level: number };

export const environments = ["development", "test", "production"] as const;

export async function seed({ context }: SeederArguments): Promise<void> {
  for (const role of SYSTEM_ROLES) {
    await context.database.query(
      `INSERT INTO roles (id, name, level, created_at, updated_at)
       VALUES (:id, :name, :level, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      { replacements: role, transaction: context.transaction },
    );

    const persistedRoles = await context.database.query<PersistedRole>(
      "SELECT id, name, level FROM roles WHERE name = :name",
      {
        replacements: { name: role.name },
        transaction: context.transaction,
        type: QueryTypes.SELECT,
      },
    );
    const persistedRole = persistedRoles[0];
    if (
      !persistedRole ||
      persistedRole.id !== role.id ||
      persistedRole.name !== role.name ||
      persistedRole.level !== role.level
    ) {
      throw new Error(`Seeded role ${role.name} differs from the expected catalog`);
    }
  }
}
