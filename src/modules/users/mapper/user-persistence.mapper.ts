import { User } from "../entity/user.entity.js";
import type { UserModelRow } from "../model/user-model.type.js";
import { ValidationError } from "../../../shared/errors/validation-error.js";
export function toUserEntity(row: UserModelRow): User {
  try {
    return new User({
      id: row.id,
      roleId: row.role_id,
      name: row.name,
      email: row.email,
      phone_number: row.phone_number,
      country_code: row.country_code,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  } catch (error) {
    if (error instanceof ValidationError)
      throw new Error("Persisted user violates domain invariants", { cause: error });
    throw error;
  }
}
