import type { Model, ModelStatic } from "sequelize";
export interface AuthCredentialModelRow extends Model {
  userId: string;
  passwordHash: string | null;
  deletedAt: Date | null;
}
export type AuthCredentialModel = ModelStatic<AuthCredentialModelRow>;
