import type { ErrorRequestHandler } from "express";
import type { Logger } from "pino";
import { ApplicationError } from "../errors/application-error.js";
import type { ApplicationErrorDetail, ErrorDetail } from "../errors/application-error.type.js";
import { ValidationError } from "../errors/validation-error.js";
import { sendFailure } from "./response.js";
import { getLocalizer, getRequestContext } from "./http-context.js";
import { toValidationErrorDetail } from "./validation-error.mapper.js";
import type { Localizer } from "./http.type.js";

function toResponseErrorDetails(
  details: ApplicationErrorDetail[],
  localizer: Localizer,
): ErrorDetail[] {
  return details.map((detail) => ({
    field: detail.field,
    location: detail.location,
    code: detail.code,
    message:
      "messageKey" in detail && detail.messageKey
        ? localizer.translate(detail.messageKey)
        : (detail.message ?? localizer.translate("common.invalid")),
  }));
}

export function createErrorMiddleware(logger: Logger): ErrorRequestHandler {
  return (error: unknown, _request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }
    let failure = error instanceof ApplicationError ? error : undefined;
    if (error instanceof ValidationError)
      failure = new ApplicationError("validation_error", [
        toValidationErrorDetail(error, getLocalizer(response)),
      ]);
    if (error && typeof error === "object" && "type" in error) {
      if (error.type === "entity.parse.failed") failure = new ApplicationError("bad_request");
      if (error.type === "entity.too.large") failure = new ApplicationError("content_too_large");
      if (error.type === "encoding.unsupported")
        failure = new ApplicationError("unsupported_media_type", [
          {
            field: "Content-Encoding",
            location: "header",
            code: "content_encoding_unsupported",
            messageKey: "common.contentEncodingUnsupported",
          },
        ]);
      if (error.type === "charset.unsupported")
        failure = new ApplicationError("unsupported_media_type", [
          {
            field: "Content-Type",
            location: "header",
            code: "content_type_charset_unsupported",
            messageKey: "common.contentTypeCharsetUnsupported",
          },
        ]);
      if (error.type === "request.aborted") failure = new ApplicationError("service_unavailable");
    }
    if (failure) {
      sendFailure(
        response,
        failure.kind,
        failure.details ? toResponseErrorDetails(failure.details, getLocalizer(response)) : null,
      );
      return;
    }
    logger.error(
      {
        requestId: getRequestContext(response).requestId,
        errorName: error instanceof Error ? error.name : "UnknownError",
        stackFrames:
          error instanceof Error
            ? error.stack
                ?.split("\n")
                .filter((line) => line.trimStart().startsWith("at "))
                .join("\n")
            : undefined,
      },
      "http.request.failed",
    );
    sendFailure(response, "internal_server_error");
  };
}
