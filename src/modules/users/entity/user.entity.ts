import type { UserProperties } from "./user.type.js";
import { UserValidationError } from "../errors/user.error.js";

export class User {
  readonly id: string;
  readonly roleId: string;
  readonly name: string;
  readonly email: string;
  readonly phone_number: string | null;
  readonly country_code: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  constructor(properties: UserProperties) {
    if (typeof properties.name !== "string") throw new UserValidationError("name", "name_invalid");
    if (typeof properties.email !== "string")
      throw new UserValidationError("email", "email_invalid");
    const name = properties.name.trim();
    const email = properties.email.trim().toLowerCase();
    if (!name || name.length > 100) throw new UserValidationError("name", "name_invalid");
    if (!email || email.length > 254 || !email.includes("@"))
      throw new UserValidationError("email", "email_invalid");
    if (
      properties.phone_number !== null &&
      (typeof properties.phone_number !== "string" || properties.phone_number.length > 20)
    )
      throw new UserValidationError("phone_number", "phone_number_invalid");
    if (
      properties.country_code !== null &&
      (typeof properties.country_code !== "string" || properties.country_code.length > 5)
    )
      throw new UserValidationError("country_code", "country_code_invalid");
    this.id = properties.id;
    this.roleId = properties.roleId;
    this.name = name;
    this.email = email;
    this.phone_number = properties.phone_number;
    this.country_code = properties.country_code;
    this.createdAt = properties.createdAt;
    this.updatedAt = properties.updatedAt;
  }
}
