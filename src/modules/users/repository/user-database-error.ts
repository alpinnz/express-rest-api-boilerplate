import { UniqueConstraintError } from "sequelize";
import { ApplicationError } from "../../../shared/errors/application-error.js";
import { translateDatabaseError } from "../../../shared/database/database-error.js";

function isEmailUniqueConstraint(error: UniqueConstraintError): boolean {
  const parent = error.parent as Error & { constraint?: unknown };
  return (
    parent.constraint === "users_email_key" ||
    Object.prototype.hasOwnProperty.call(error.fields, "email") ||
    error.errors.some((detail) => detail.path === "email")
  );
}

export function translateUserDatabaseError(error: unknown): Error {
  if (error instanceof UniqueConstraintError && isEmailUniqueConstraint(error)) {
    return new ApplicationError("conflict", [
      {
        field: "email",
        location: "body",
        code: "email_already_used",
        messageKey: "common.emailAlreadyUsed",
      },
    ]);
  }
  return translateDatabaseError(error);
}
