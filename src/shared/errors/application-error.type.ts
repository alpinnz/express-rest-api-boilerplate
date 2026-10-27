import type { applicationErrorDefinitions } from "./application-error.definition.js";

export type ApplicationErrorCode = keyof typeof applicationErrorDefinitions;
export type ErrorLocation = "body" | "query" | "path" | "header" | "system";
export type ErrorDetail = {
  field: string;
  location: ErrorLocation;
  code: string;
  message: string;
};
export type ApplicationErrorDetail = Pick<ErrorDetail, "field" | "location" | "code"> &
  ({ message: string; messageKey?: never } | { messageKey: string; message?: never });
