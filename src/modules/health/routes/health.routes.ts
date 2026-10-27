import { Router } from "express";
import type { RequestHandler } from "express";
import { ApplicationError } from "../../../shared/errors/application-error.js";
import { getRequestContext } from "../../../shared/http/http-context.js";

const methodNotAllowed: RequestHandler = (_request, response) => {
  response.setHeader("Allow", "GET, HEAD, OPTIONS");
  throw new ApplicationError("method_not_allowed");
};

export function createHealthRouter() {
  const router = Router();
  router
    .route("/")
    .get((request, response) =>
      getRequestContext(response)
        .scope.resolve("healthController")
        .getHealthStatus(request, response),
    )
    .all(methodNotAllowed);
  return router;
}
