import { randomUUIDv7 } from "../uuid/uuid-v7.js";
import type { AwilixContainer } from "awilix";
import type { RequestHandler } from "express";
import type { Cradle } from "../../container.type.js";
import type { RequestContext } from "./http.type.js";
export function createRequestContextMiddleware(root: AwilixContainer<Cradle>): RequestHandler {
  return (request, response, next) => {
    const scope = root.createScope();
    const requestId = randomUUIDv7();
    const requestContext: RequestContext = {
      requestId,
      scope,
      validated: {},
      authenticatedUserId: null,
    };
    response.locals.requestContext = requestContext;
    response.setHeader("X-Request-Id", requestId);
    const started = performance.now();
    let disposed = false;
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      void scope
        .dispose()
        .catch(() => root.resolve("logger").error({ requestId }, "http.scope.dispose_failed"));
    };
    response.once("finish", () => {
      root.resolve("logger").info(
        {
          requestId,
          method: request.method,
          path: request.path,
          statusCode: response.statusCode,
          durationMs: performance.now() - started,
        },
        "http.request.completed",
      );
      dispose();
    });
    response.once("close", dispose);
    next();
  };
}
