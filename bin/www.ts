#!/usr/bin/env node
import http from "node:http";
import createDebug from "debug";
import { loadEnvironment } from "../src/config/environment.js";
import { createDependencyContainer } from "../src/container.js";
import { createApp } from "../src/app.js";

const environment = loadEnvironment();
const container = createDependencyContainer(environment);
const logger = container.resolve("logger");
const database = container.resolve("database");
const debug = createDebug("express-rest-api-boilerplate:server");
let stopping = false;
const app = createApp(container, async () => {
  if (stopping) throw new Error("Shutting down");
  await database.authenticate();
});
const server = http.createServer(app);
server.requestTimeout = 15000;
server.headersTimeout = 16000;
server.keepAliveTimeout = 5000;

async function shutdown(exitCode: number): Promise<void> {
  if (stopping) return;
  stopping = true;
  debug("shutdown started");
  const deadline = setTimeout(() => {
    server.closeAllConnections();
    process.exit(1);
  }, 10000);
  deadline.unref();
  server.closeIdleConnections();
  try {
    if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
    await container.dispose();
  } catch {
    exitCode = 1;
    logger.error("server.dispose_failed");
  } finally {
    clearTimeout(deadline);
    process.exitCode = exitCode;
  }
}
server.on("error", (error: NodeJS.ErrnoException) => {
  logger.fatal({ code: error.code }, "server.error");
  void shutdown(1);
});
process.once("SIGTERM", () => {
  void shutdown(0);
});
process.once("SIGINT", () => {
  void shutdown(0);
});
process.once("uncaughtException", () => {
  logger.fatal("process.uncaught_exception");
  void shutdown(1);
});
process.once("unhandledRejection", () => {
  logger.fatal("process.unhandled_rejection");
  void shutdown(1);
});
try {
  await database.authenticate();
  if (!stopping)
    server.listen(environment.port, environment.host, () => {
      logger.info({ port: environment.port }, "server.started");
    });
} catch {
  logger.fatal("server.startup_failed");
  await shutdown(1);
}
