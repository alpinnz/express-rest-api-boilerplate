import type { Transaction } from "sequelize";
import type { User } from "../entity/user.entity.js";
import type { CreateUserCommand } from "../types/user-command.type.js";

export interface UserProfileServiceApi {
  create(input: CreateUserCommand, transaction?: Transaction): Promise<User>;
  findById(userId: string, transaction?: Transaction): Promise<User | null>;
  findByEmail(email: string, transaction?: Transaction): Promise<User | null>;
  softDelete(userId: string, transaction?: Transaction): Promise<void>;
}
