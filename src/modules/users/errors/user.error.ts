import { ValidationError } from "../../../shared/errors/validation-error.js";
export class UserValidationError extends ValidationError {
  constructor(
    field: "name" | "email" | "phone_number" | "country_code",
    issueCode: "name_invalid" | "email_invalid" | "phone_number_invalid" | "country_code_invalid",
  ) {
    super(field, issueCode);
    this.name = "UserValidationError";
  }
}
