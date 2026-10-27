import { ValidationError } from "../../../shared/errors/validation-error.js";

export class AuthValidationError extends ValidationError {
  constructor(
    field: "credentials" | "refresh_token" | "current_password",
    issueCode: "credentials_invalid" | "refresh_token_invalid" | "current_password_invalid",
  ) {
    super(field, issueCode);
    this.name = "AuthValidationError";
  }
}
