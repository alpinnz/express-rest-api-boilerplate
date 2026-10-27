import { Router } from "express";
import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { getRequestContext } from "../../../shared/http/http-context.js";
import { ApplicationError } from "../../../shared/errors/application-error.js";
import { validateRequest } from "../../../shared/http/validate-request.middleware.js";
import { sendFailure } from "../../../shared/http/response.js";
import {
  changeCurrentUserPasswordBodySchema,
  deactivateCurrentUserBodySchema,
  updateCurrentUserProfileBodySchema,
  userListPaginationSchema,
  updateUserBodySchema,
  userPathParamsSchema,
} from "../schema/user.schema.js";

const accountPasswordAttemptRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) => sendFailure(response, "too_many_requests"),
});

export function createUserRouter(
  requireAuthentication: RequestHandler,
  requireAdminRole: RequestHandler,
  requireOwnerRole: RequestHandler,
) {
  const router = Router();
  const methodNotAllowed =
    (allow: string): RequestHandler =>
    (_request, response) => {
      response.setHeader("Allow", allow);
      throw new ApplicationError("method_not_allowed");
    };
  router
    .route("/me")
    .get(requireAuthentication, (request, response) =>
      getRequestContext(response).scope.resolve("userController").getCurrent(request, response),
    )
    .patch(
      requireAuthentication,
      validateRequest(updateCurrentUserProfileBodySchema, "body"),
      (request, response) =>
        getRequestContext(response)
          .scope.resolve("userController")
          .updateCurrent(request, response),
    )
    .delete(
      requireAuthentication,
      accountPasswordAttemptRateLimit,
      validateRequest(deactivateCurrentUserBodySchema, "body"),
      (request, response) =>
        getRequestContext(response)
          .scope.resolve("userController")
          .deactivateCurrent(request, response),
    )
    .all(methodNotAllowed("GET, HEAD, PATCH, DELETE, OPTIONS"));
  router
    .route("/me/password")
    .put(
      requireAuthentication,
      accountPasswordAttemptRateLimit,
      validateRequest(changeCurrentUserPasswordBodySchema, "body"),
      (request, response) =>
        getRequestContext(response)
          .scope.resolve("userController")
          .changeCurrentPassword(request, response),
    )
    .all(methodNotAllowed("PUT, OPTIONS"));
  router
    .route("/")
    .get(
      requireAuthentication,
      requireAdminRole,
      validateRequest(userListPaginationSchema, "query"),
      (request, response) =>
        getRequestContext(response).scope.resolve("userController").list(request, response),
    )
    .all(methodNotAllowed("GET, HEAD, POST, OPTIONS"));
  router
    .route("/:user_id")
    .get(
      requireAuthentication,
      requireAdminRole,
      validateRequest(userPathParamsSchema, "path"),
      (request, response) =>
        getRequestContext(response).scope.resolve("userController").get(request, response),
    )
    .put(
      requireAuthentication,
      requireOwnerRole,
      validateRequest(userPathParamsSchema, "path"),
      validateRequest(updateUserBodySchema, "body"),
      (request, response) =>
        getRequestContext(response).scope.resolve("userController").update(request, response),
    )
    .delete(
      requireAuthentication,
      requireOwnerRole,
      validateRequest(userPathParamsSchema, "path"),
      (request, response) =>
        getRequestContext(response).scope.resolve("userController").delete(request, response),
    )
    .all(methodNotAllowed("GET, HEAD, PUT, DELETE, OPTIONS"));
  return router;
}
