import type { RequestHandler } from "express";
import { ApplicationError } from "../../../shared/errors/application-error.js";
import { getRequestContext } from "../../../shared/http/http-context.js";

function createUnauthorizedError(code: string, messageKey: string): ApplicationError {
  return new ApplicationError("unauthorized", [
    {
      field: "Authorization",
      location: "header",
      code,
      messageKey,
    },
  ]);
}

export const requireAuthentication: RequestHandler = async (request, response, next) => {
  const authorization = request.get("authorization");
  if (authorization === undefined)
    throw createUnauthorizedError("bearer_token_required", "common.bearerTokenRequired");

  const bearerToken = /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(authorization)?.[1];
  if (!bearerToken)
    throw createUnauthorizedError("access_token_invalid", "common.accessTokenInvalid");

  const requestContext = getRequestContext(response);
  const userId = await requestContext.scope
    .resolve("authService")
    .findActiveUserIdByAccessToken(bearerToken);
  if (!userId) throw createUnauthorizedError("access_token_invalid", "common.accessTokenInvalid");

  requestContext.authenticatedUserId = userId;
  next();
};
