import type { Environment } from "./environment.type.js";

export function loadEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  function required(name: string): string {
    const value = source[name];
    if (value === undefined || value.length === 0) throw new Error("Missing environment: " + name);
    return value;
  }
  function integer(name: string, fallback: number, min: number, max: number): number {
    const raw = source[name];
    const value = raw === undefined ? fallback : Number(raw);
    if (!raw?.trim() && raw !== undefined) throw new Error("Invalid environment: " + name);
    if (!Number.isInteger(value) || value < min || value > max)
      throw new Error("Invalid environment: " + name);
    return value;
  }
  const nodeEnv = source.NODE_ENV ?? "development";
  if (nodeEnv !== "development" && nodeEnv !== "test" && nodeEnv !== "production")
    throw new Error("Invalid NODE_ENV");
  const ssl = source.DATABASE_SSL ?? "false";
  if (ssl !== "true" && ssl !== "false") throw new Error("Invalid DATABASE_SSL");
  const origins = source.CORS_ORIGINS ?? "http://localhost:5173";
  let corsOrigins: Environment["corsOrigins"] = "*";
  if (origins.trim() !== "*") {
    corsOrigins = origins
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!corsOrigins.length) throw new Error("Invalid CORS_ORIGINS");
    for (const origin of corsOrigins) {
      try {
        const parsed = new URL(origin);
        if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin)
          throw new Error();
      } catch {
        throw new Error("Invalid CORS_ORIGINS");
      }
    }
  }
  const logLevel = source.LOG_LEVEL ?? "info";
  if (!["trace", "debug", "info", "warn", "error", "fatal", "silent"].includes(logLevel))
    throw new Error("Invalid LOG_LEVEL");
  const authAccessTokenTtlSeconds = integer("AUTH_ACCESS_TOKEN_TTL_SECONDS", 900, 60, 3600);
  const authRefreshTokenTtlSeconds = integer(
    "AUTH_REFRESH_TOKEN_TTL_SECONDS",
    86400,
    60,
    90 * 24 * 60 * 60,
  );
  const authRememberMeRefreshTokenTtlSeconds = integer(
    "AUTH_REMEMBER_ME_REFRESH_TOKEN_TTL_SECONDS",
    7 * 24 * 60 * 60,
    60,
    90 * 24 * 60 * 60,
  );
  if (authRefreshTokenTtlSeconds < authAccessTokenTtlSeconds)
    throw new Error(
      "AUTH_REFRESH_TOKEN_TTL_SECONDS must be at least AUTH_ACCESS_TOKEN_TTL_SECONDS",
    );
  if (authRememberMeRefreshTokenTtlSeconds < authRefreshTokenTtlSeconds)
    throw new Error(
      "AUTH_REMEMBER_ME_REFRESH_TOKEN_TTL_SECONDS must be at least AUTH_REFRESH_TOKEN_TTL_SECONDS",
    );
  return {
    nodeEnv,
    host: source.HOST ?? "127.0.0.1",
    port: integer("PORT", 3000, 1, 65535),
    databaseHost: required("DATABASE_HOST"),
    databasePort: integer("DATABASE_PORT", 5432, 1, 65535),
    databaseName: required("DATABASE_NAME"),
    databaseUser: required("DATABASE_USER"),
    databasePass: required("DATABASE_PASS"),
    databaseSsl: ssl === "true",
    databasePoolMax: integer("DB_POOL_MAX", 10, 1, 100),
    corsOrigins,
    logLevel,
    rateLimitMax: integer("RATE_LIMIT_MAX", 300, 1, 100000),
    trustProxyCidrs: (source.TRUST_PROXY_CIDRS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    authAccessTokenTtlSeconds,
    authRefreshTokenTtlSeconds,
    authRememberMeRefreshTokenTtlSeconds,
  };
}
