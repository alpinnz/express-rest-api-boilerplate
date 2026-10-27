import { transformValues, validateSchema } from "@valfuse-node/validation";
import type { ValfuseSchema } from "@valfuse-node/validation";
import type { RequestHandler } from "express";
import { ApplicationError } from "../errors/application-error.js";
import { getRequestContext, getLocalizer } from "./http-context.js";
import { getValidationErrorMessage } from "./validation-error.mapper.js";
import type { InputLocation } from "./http.type.js";

export function validateRequest(schema: ValfuseSchema, location: InputLocation): RequestHandler {
  return (request, response, next) => {
    const raw: unknown =
      location === "path"
        ? request.params
        : location === "query"
          ? request.query
          : request.body === undefined
            ? {}
            : request.body;
    if (raw === null || typeof raw !== "object" || Array.isArray(raw))
      throw new ApplicationError("bad_request");
    const input = raw as Record<string, unknown>;
    const projected = Object.fromEntries(Object.keys(schema).map((key) => [key, input[key]]));
    const values = transformValues(schema, projected);
    const errors = validateSchema(schema, values);
    if (Object.keys(errors).length) {
      throw new ApplicationError(
        "bad_request",
        Object.entries(errors).map(([field, error]) => ({
          field,
          location,
          code: error.code ?? "invalid",
          message: getValidationErrorMessage(error.code ?? "invalid", getLocalizer(response)),
        })),
      );
    }
    getRequestContext(response).validated[location] = values;
    next();
  };
}
