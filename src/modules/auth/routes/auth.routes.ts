import { Router } from "express";
import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { ApplicationError } from "../../../shared/errors/application-error.js";
import { getRequestContext } from "../../../shared/http/http-context.js";
import { sendFailure } from "../../../shared/http/response.js";
import { validateRequest } from "../../../shared/http/validate-request.middleware.js";
import {
  loginBodySchema,
  logoutBodySchema,
  refreshTokenBodySchema,
  registerUserBodySchema,
} from "../schema/auth.schema.js";

const authAttemptRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) => sendFailure(response, "too_many_requests"),
});

const methodNotAllowed =
  (allow: string): RequestHandler =>
  (_request, response) => {
    response.setHeader("Allow", allow);
    throw new ApplicationError("method_not_allowed");
  };

function registerUserHandler(): RequestHandler {
  return (request, response) =>
    getRequestContext(response).scope.resolve("authController").register(request, response);
}

export function createUserRegistrationRouter() {
  const router = Router();
  router.post(
    "/",
    authAttemptRateLimit,
    validateRequest(registerUserBodySchema, "body"),
    registerUserHandler(),
  );
  return router;
}

export function createAuthRouter() {
  const router = Router();
  router
    .route("/register")
    .post(
      authAttemptRateLimit,
      validateRequest(registerUserBodySchema, "body"),
      registerUserHandler(),
    )
    .all(methodNotAllowed("POST, OPTIONS"));
  router
    .route("/login")
    .post(authAttemptRateLimit, validateRequest(loginBodySchema, "body"), (request, response) =>
      getRequestContext(response).scope.resolve("authController").login(request, response),
    )
    .all(methodNotAllowed("POST, OPTIONS"));
  router
    .route("/logout")
    .post(validateRequest(logoutBodySchema, "body"), (request, response) =>
      getRequestContext(response).scope.resolve("authController").logout(request, response),
    )
    .all(methodNotAllowed("POST, OPTIONS"));
  router
    .route("/refresh-token")
    .post(validateRequest(refreshTokenBodySchema, "body"), (request, response) =>
      getRequestContext(response).scope.resolve("authController").refreshToken(request, response),
    )
    .all(methodNotAllowed("POST, OPTIONS"));
  return router;
}
