import type { RequestHandler } from "express";
import { ApplicationError } from "../../../shared/errors/application-error.js";
import { getRequestContext } from "../../../shared/http/http-context.js";

export function requireMinimumRoleLevel(minimumLevel: number): RequestHandler {
  return async (_request, response, next) => {
    const requestContext = getRequestContext(response);
    const actorUserId = requestContext.authenticatedUserId;
    if (actorUserId === null)
      throw new ApplicationError("unauthorized", [
        {
          field: "Authorization",
          location: "header",
          code: "bearer_token_required",
          messageKey: "common.bearerTokenRequired",
        },
      ]);

    const actor = await requestContext.scope.resolve("userService").getProfileWithRole(actorUserId);
    if (actor.role.level < minimumLevel)
      throw new ApplicationError("forbidden", [
        {
          field: "Authorization",
          location: "header",
          code: "user_management_level_insufficient",
          messageKey: "roles.userManagementLevelInsufficient",
        },
      ]);

    next();
  };
}
