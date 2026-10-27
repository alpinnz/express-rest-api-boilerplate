import { QueryTypes } from "sequelize";
import { NodeArgon2PasswordHasher } from "../src/modules/auth/security/node-argon2-password-hasher.js";
import type { SeederArguments } from "../src/shared/database/seeder.type.js";

const developmentUser = {
  id: "01a17aa8-1c00-7005-8105-100000000005",
  roleId: "01a17aa8-1c00-7001-8101-100000000001",
  name: "Local Demo Admin",
  email: "demo-admin@example.test",
};
const strongPasswordPattern = /^(?=.{8,72}$)(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s]).+$/;

type PersistedUser = {
  id: string;
  role_id: string;
  name: string;
  email: string;
  deleted_at: Date | null;
};

export const environments = ["development", "test"] as const;

export async function seed({ context }: SeederArguments): Promise<void> {
  await context.database.query(
    `INSERT INTO users (
       id, role_id, name, email, phone_number, country_code, created_at, updated_at, deleted_at
     ) VALUES (
       :id, :roleId, :name, :email, NULL, NULL, NOW(), NOW(), NULL
     )
     ON CONFLICT DO NOTHING`,
    { replacements: developmentUser, transaction: context.transaction },
  );

  const users = await context.database.query<PersistedUser>(
    "SELECT id, role_id, name, email, deleted_at FROM users WHERE id = :id",
    {
      replacements: { id: developmentUser.id },
      transaction: context.transaction,
      type: QueryTypes.SELECT,
    },
  );
  const persistedUser = users[0];
  if (
    !persistedUser ||
    persistedUser.id !== developmentUser.id ||
    persistedUser.role_id !== developmentUser.roleId ||
    persistedUser.name !== developmentUser.name ||
    persistedUser.email !== developmentUser.email
  ) {
    throw new Error("Development demo user differs from the expected fixture");
  }
  if (persistedUser.deleted_at !== null) return;

  const credentials = await context.database.query<{ user_id: string }>(
    "SELECT user_id FROM auth_credentials WHERE user_id = :userId",
    {
      replacements: { userId: developmentUser.id },
      transaction: context.transaction,
      type: QueryTypes.SELECT,
    },
  );
  if (credentials[0]) return;

  const password = process.env.SEED_DEMO_USER_PASSWORD;
  if (!password || !strongPasswordPattern.test(password))
    throw new Error("SEED_DEMO_USER_PASSWORD must meet the registration password policy");

  const passwordHash = await new NodeArgon2PasswordHasher().hash(password);
  await context.database.query(
    `INSERT INTO auth_credentials (user_id, password_hash, deleted_at)
     VALUES (:userId, :passwordHash, NULL)
     ON CONFLICT (user_id) DO NOTHING`,
    {
      replacements: { userId: developmentUser.id, passwordHash },
      transaction: context.transaction,
    },
  );
}
