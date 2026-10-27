import { ConnectionError, TimeoutError, UniqueConstraintError } from "sequelize";
import { ApplicationError } from "../errors/application-error.js";

export function translateDatabaseError(error: unknown): Error {
  if (error instanceof ApplicationError) return error;
  if (error instanceof UniqueConstraintError) return new ApplicationError("conflict");
  if (error instanceof ConnectionError || error instanceof TimeoutError)
    return new ApplicationError("service_unavailable");
  return error instanceof Error ? error : new Error("Unknown database failure");
}
