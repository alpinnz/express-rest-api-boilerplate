import type { ApplicationErrorDetail, ApplicationErrorCode } from "./application-error.type.js";

export class ApplicationError extends Error {
  constructor(
    public readonly kind: ApplicationErrorCode,
    public readonly details: ApplicationErrorDetail[] | null = null,
  ) {
    super(kind);
    this.name = "ApplicationError";
  }
}
