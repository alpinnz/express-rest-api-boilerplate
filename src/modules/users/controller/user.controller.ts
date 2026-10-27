import type { Request, Response } from "express";
import type { UserServiceApi } from "../service/user-service.type.js";
import type { AuthenticatedUserAccountServiceApi } from "../service/authenticated-user-account-service.type.js";
import type {
  ChangeCurrentUserPasswordRequest,
  DeactivateCurrentUserRequest,
  UpdateCurrentUserProfileRequest,
  UpdateUserRequest,
  UserPathParams,
} from "../types/user-request.type.js";
import type { UserListPagination } from "../types/user-pagination.type.js";
import { getRequestContext, getValidated } from "../../../shared/http/http-context.js";
import { sendSuccess } from "../../../shared/http/response.js";
import { ApplicationError } from "../../../shared/errors/application-error.js";
import { toCurrentUserProfileResponse, toUserResponse } from "../mapper/user-http.mapper.js";
export class UserController {
  constructor(
    private readonly userService: UserServiceApi,
    private readonly authService: AuthenticatedUserAccountServiceApi,
  ) {}
  async getCurrent(_request: Request, response: Response): Promise<void> {
    const userId = getRequestContext(response).authenticatedUserId;
    if (userId === null) throw new Error("Authenticated user is missing from request context");
    sendSuccess(
      response,
      200,
      "success",
      toCurrentUserProfileResponse(await this.userService.getProfileWithRole(userId)),
    );
  }
  async updateCurrent(_request: Request, response: Response): Promise<void> {
    const userId = getRequestContext(response).authenticatedUserId;
    if (userId === null) throw new Error("Authenticated user is missing from request context");
    const body = getValidated<UpdateCurrentUserProfileRequest>(response, "body");
    const user = await this.userService.update({ userId, ...body });
    sendSuccess(response, 200, "updated", toUserResponse(user));
  }
  async changeCurrentPassword(_request: Request, response: Response): Promise<void> {
    const userId = getRequestContext(response).authenticatedUserId;
    if (userId === null) throw new Error("Authenticated user is missing from request context");
    const body = getValidated<ChangeCurrentUserPasswordRequest>(response, "body");
    await this.authService.changePassword(userId, body.current_password, body.new_password);
    sendSuccess(response, 200, "updated", null);
  }
  async deactivateCurrent(_request: Request, response: Response): Promise<void> {
    const userId = getRequestContext(response).authenticatedUserId;
    if (userId === null) throw new Error("Authenticated user is missing from request context");
    const { current_password } = getValidated<DeactivateCurrentUserRequest>(response, "body");
    await this.authService.deactivateAccount(userId, current_password);
    sendSuccess(response, 200, "deleted", null);
  }
  async get(_request: Request, response: Response): Promise<void> {
    const { user_id } = getValidated<UserPathParams>(response, "path");
    sendSuccess(response, 200, "success", toUserResponse(await this.userService.get(user_id)));
  }
  async list(_request: Request, response: Response): Promise<void> {
    const pagination = getValidated<UserListPagination>(response, "query");
    const result = await this.userService.list(pagination);
    const totalPage = Math.ceil(result.total / pagination.limit);
    sendSuccess(
      response,
      200,
      "success",
      { items: result.items.map(toUserResponse), count: result.items.length },
      {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        total_page: totalPage,
        has_next: pagination.page < totalPage,
        has_prev: pagination.page > 1,
      },
    );
  }
  async update(_request: Request, response: Response): Promise<void> {
    const { user_id } = getValidated<UserPathParams>(response, "path");
    this.assertActorDoesNotTargetSelf(response, user_id);
    const body = getValidated<UpdateUserRequest>(response, "body");
    const user = await this.userService.update({
      userId: user_id,
      name: body.name,
      phone_number: body.phone_number ?? null,
      country_code: body.country_code ?? null,
    });
    sendSuccess(response, 200, "updated", toUserResponse(user));
  }
  async delete(_request: Request, response: Response): Promise<void> {
    const { user_id } = getValidated<UserPathParams>(response, "path");
    this.assertActorDoesNotTargetSelf(response, user_id);
    await this.authService.deactivateAccountByAdministrator(user_id);
    sendSuccess(response, 200, "deleted", null);
  }

  private assertActorDoesNotTargetSelf(response: Response, targetUserId: string): void {
    if (getRequestContext(response).authenticatedUserId !== targetUserId) return;
    throw new ApplicationError("forbidden", [
      {
        field: "user_id",
        location: "path",
        code: "self_user_management_forbidden",
        messageKey: "common.selfUserManagementForbidden",
      },
    ]);
  }
}
