import { Router } from "express";
import type { RequestHandler } from "express";
import { ApplicationError } from "../../../shared/errors/application-error.js";
import { getRequestContext } from "../../../shared/http/http-context.js";
import { validateRequest } from "../../../shared/http/validate-request.middleware.js";
import {
  changeUserRoleBodySchema,
  createRoleBodySchema,
  rolePathParamsSchema,
  updateRoleBodySchema,
  userRolePathParamsSchema,
} from "../schema/role.schema.js";

function methodNotAllowed(allow: string): RequestHandler {
  return (_request, response) => {
    response.setHeader("Allow", allow);
    throw new ApplicationError("method_not_allowed");
  };
}

export function createRolesRouter(requireAuthentication: RequestHandler) {
  const router = Router();
  router
    .route("/")
    .get(requireAuthentication, (_request, response) =>
      getRequestContext(response).scope.resolve("roleController").list(_request, response),
    )
    .post(
      requireAuthentication,
      validateRequest(createRoleBodySchema, "body"),
      (request, response) =>
        getRequestContext(response).scope.resolve("roleController").create(request, response),
    )
    .all(methodNotAllowed("GET, HEAD, POST, OPTIONS"));
  router
    .route("/:role_id")
    .get(
      requireAuthentication,
      validateRequest(rolePathParamsSchema, "path"),
      (request, response) =>
        getRequestContext(response).scope.resolve("roleController").get(request, response),
    )
    .patch(
      requireAuthentication,
      validateRequest(rolePathParamsSchema, "path"),
      validateRequest(updateRoleBodySchema, "body"),
      (request, response) =>
        getRequestContext(response).scope.resolve("roleController").update(request, response),
    )
    .delete(
      requireAuthentication,
      validateRequest(rolePathParamsSchema, "path"),
      (request, response) =>
        getRequestContext(response).scope.resolve("roleController").delete(request, response),
    )
    .all(methodNotAllowed("GET, HEAD, PATCH, DELETE, OPTIONS"));
  return router;
}

export function createUserRoleRouter(requireAuthentication: RequestHandler) {
  const router = Router();
  router
    .route("/:user_id/role")
    .patch(
      requireAuthentication,
      validateRequest(userRolePathParamsSchema, "path"),
      validateRequest(changeUserRoleBodySchema, "body"),
      (request, response) =>
        getRequestContext(response)
          .scope.resolve("roleController")
          .changeUserRole(request, response),
    )
    .all(methodNotAllowed("PATCH, OPTIONS"));
  return router;
}
