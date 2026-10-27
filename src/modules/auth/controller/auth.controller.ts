import type { Request, Response } from "express";
import type { AuthServiceApi } from "../service/auth-service.type.js";
import type {
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterUserRequest,
} from "../types/auth-request.type.js";
import { getValidated } from "../../../shared/http/http-context.js";
import { sendSuccess } from "../../../shared/http/response.js";

export class AuthController {
  constructor(private readonly authService: AuthServiceApi) {}

  async register(_request: Request, response: Response): Promise<void> {
    const body = getValidated<RegisterUserRequest>(response, "body");
    const data = await this.authService.register({
      name: body.name,
      email: body.email,
      phone_number: body.phone_number ?? null,
      country_code: body.country_code ?? null,
      password: body.password,
    });
    sendSuccess(response, 201, "created", data);
  }

  async login(_request: Request, response: Response): Promise<void> {
    const body = getValidated<LoginRequest>(response, "body");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Pragma", "no-cache");
    sendSuccess(
      response,
      200,
      "success",
      await this.authService.login({
        email: body.email,
        password: body.password,
        remember_me: body.remember_me ?? false,
      }),
    );
  }

  async refreshToken(_request: Request, response: Response): Promise<void> {
    const { refresh_token } = getValidated<RefreshTokenRequest>(response, "body");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Pragma", "no-cache");
    sendSuccess(response, 200, "success", await this.authService.refreshToken(refresh_token));
  }

  async logout(_request: Request, response: Response): Promise<void> {
    const { refresh_token } = getValidated<LogoutRequest>(response, "body");
    await this.authService.logout(refresh_token);
    sendSuccess(response, 200, "success", null);
  }
}
