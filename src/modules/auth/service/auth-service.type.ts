import type { AuthTokenResponse } from "../types/auth-token-response.type.js";
import type { LoginCommand, RegisterUserCommand } from "../types/auth-command.type.js";
import type { AuthenticatedUserAccountServiceApi } from "../../users/service/authenticated-user-account-service.type.js";

export interface AuthServiceApi extends AuthenticatedUserAccountServiceApi {
  register(input: RegisterUserCommand): Promise<{ id: string }>;
  login(input: LoginCommand): Promise<AuthTokenResponse>;
  findActiveUserIdByAccessToken(accessToken: string): Promise<string | null>;
  refreshToken(refreshToken: string): Promise<AuthTokenResponse>;
  logout(refreshToken: string): Promise<void>;
}
