import pino from "pino";
import type { Environment } from "../../config/environment.type.js";
export function createLogger(environment: Environment) {
  return pino({
    level: environment.logLevel,
    base: { service: "express-rest-api-boilerplate" },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "password",
        "confirm_password",
        "passwordHash",
        "databasePass",
        "req.headers.authorization",
        "req.headers.cookie",
      ],
      censor: "[REDACTED]",
    },
  });
}
