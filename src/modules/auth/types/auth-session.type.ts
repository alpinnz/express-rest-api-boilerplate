export type AuthSession = {
  id: string;
  userId: string;
  accessTokenHash: string;
  refreshTokenHash: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
  rememberMe: boolean;
  revokedAt: Date | null;
};

export type AuthSessionTokens = Pick<
  AuthSession,
  "accessTokenHash" | "refreshTokenHash" | "accessExpiresAt" | "refreshExpiresAt"
>;
