import type { CreationOptional, Model, ModelStatic } from "sequelize";

export interface RoleModelRow extends Model {
  id: string;
  name: string;
  level: number;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
  deletedAt: CreationOptional<Date | null>;
}

export type RoleModel = ModelStatic<RoleModelRow>;
