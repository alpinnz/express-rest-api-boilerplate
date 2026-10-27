import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { createLocalizationMiddleware } from "@valfuse-node/express";
import type { AwilixContainer } from "awilix";
import type { Cradle } from "./container.type.js";
import manifest from "./generated/localization/localization.js";
import { createRequestContextMiddleware } from "./shared/http/request-context.middleware.js";
import { createErrorMiddleware } from "./shared/http/error.middleware.js";
import { getLocalizer } from "./shared/http/http-context.js";
import { sendFailure } from "./shared/http/response.js";
import { ApplicationError } from "./shared/errors/application-error.js";
import { createUserRouter } from "./modules/users/routes/user.routes.js";
import {
  createAuthRouter,
  createUserRegistrationRouter,
} from "./modules/auth/routes/auth.routes.js";
import { createHealthRouter } from "./modules/health/routes/health.routes.js";
import { requireAuthentication } from "./modules/auth/middleware/require-authentication.middleware.js";
import { createRolesRouter, createUserRoleRouter } from "./modules/roles/routes/role.routes.js";
import { requireMinimumRoleLevel } from "./modules/roles/middleware/require-minimum-role-level.middleware.js";
import { ADMIN_ROLE_LEVEL, OWNER_ROLE_LEVEL } from "./modules/roles/entity/system-role-catalog.js";

export function createApp(container: AwilixContainer<Cradle>, checkReadiness: () => Promise<void>) {
  const environment = container.resolve("environment");
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", environment.trustProxyCidrs.length ? environment.trustProxyCidrs : false);
  app.use(createRequestContextMiddleware(container));
  app.use(
    createLocalizationMiddleware(manifest, {
      getLocale(request) {
        const selected = request.acceptsLanguages("id", "en");
        return typeof selected === "string" ? selected : "id";
      },
    }),
  );
  app.use((_request, response, next) => {
    response.setHeader("Content-Language", getLocalizer(response).locale);
    response.vary("Accept-Language");
    next();
  });
  app.use(helmet());
  const origins = environment.corsOrigins;
  app.use(
    cors({
      origin:
        origins === "*"
          ? "*"
          : (origin, callback) => callback(null, origin === undefined || origins.includes(origin)),
      credentials: false,
      exposedHeaders: ["X-Request-Id", "RateLimit", "RateLimit-Policy", "Retry-After"],
    }),
  );
  app.get("/health/live", (_request, response) => response.json({ status: "ok" }));
  app.get("/health/ready", async (_request, response) => {
    try {
      await checkReadiness();
      response.json({ status: "ready" });
    } catch {
      sendFailure(response, "service_unavailable");
    }
  });
  app.get("/openapi.yaml", (_request, response) =>
    response.sendFile(path.resolve("docs/api/openapi.yaml")),
  );
  app.use("/api", (request, _response, next) => {
    if (!request.accepts("application/json"))
      throw new ApplicationError("not_acceptable", [
        {
          field: "Accept",
          location: "header",
          code: "accept_not_supported",
          messageKey: "common.acceptNotSupported",
        },
      ]);
    next();
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: environment.rateLimitMax,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      handler: (_request, response) => sendFailure(response, "too_many_requests"),
    }),
  );
  app.use("/api", (request, _response, next) => {
    if (["POST", "PUT", "PATCH"].includes(request.method) && !request.is("application/json")) {
      throw new ApplicationError("unsupported_media_type", [
        {
          field: "Content-Type",
          location: "header",
          code: "content_type_unsupported",
          messageKey: "common.contentTypeUnsupported",
        },
      ]);
    }
    next();
  });
  app.use(express.json({ limit: "16kb", inflate: false, strict: true }));
  app.use("/api/v1/health", createHealthRouter());
  app.use("/api/v1/auth", createAuthRouter());
  app.use("/api/v1/users", createUserRegistrationRouter());
  app.use("/api/v1/roles", createRolesRouter(requireAuthentication));
  app.use("/api/v1/users", createUserRoleRouter(requireAuthentication));
  app.use(
    "/api/v1/users",
    createUserRouter(
      requireAuthentication,
      requireMinimumRoleLevel(ADMIN_ROLE_LEVEL),
      requireMinimumRoleLevel(OWNER_ROLE_LEVEL),
    ),
  );
  app.use((_request, _response, next) => next(new ApplicationError("not_found")));
  app.use(createErrorMiddleware(container.resolve("logger")));
  return app;
}
