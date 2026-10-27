export type Environment = {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  databaseHost: string;
  databasePort: number;
  databaseName: string;
  databaseUser: string;
  databasePass: string;
  databaseSsl: boolean;
  databasePoolMax: number;
  corsOrigins: "*" | string[];
  logLevel: string;
  rateLimitMax: number;
  trustProxyCidrs: string[];
  authAccessTokenTtlSeconds: number;
  authRefreshTokenTtlSeconds: number;
  authRememberMeRefreshTokenTtlSeconds: number;
};
