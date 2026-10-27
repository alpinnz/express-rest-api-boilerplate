import type { CreationOptional, Model, ModelStatic } from "sequelize";
export type UserRoleModelRow = Model & {
  id: string;
  name: string;
  level: number;
};
export interface UserModelRow extends Model {
  id: string;
  role_id: string;
  name: string;
  email: string;
  phone_number: string | null;
  country_code: string | null;
  role?: UserRoleModelRow;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
  deletedAt: CreationOptional<Date | null>;
}
export type UserModel = ModelStatic<UserModelRow>;
