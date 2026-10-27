import type { Request, Response } from "express";
import { getRequestContext, getValidated } from "../../../shared/http/http-context.js";
import { sendSuccess } from "../../../shared/http/response.js";
import type {
  ChangeUserRoleRequest,
  CreateRoleRequest,
  RolePathParams,
  UpdateRoleRequest,
} from "../types/role-request.type.js";
import type { RoleServiceApi } from "../service/role-service.type.js";
import type { UserRolePathParams } from "../types/role-request.type.js";
import { toRoleResponse } from "../mapper/role-http.mapper.js";

export class RoleController {
  constructor(private readonly roleService: RoleServiceApi) {}

  async create(_request: Request, response: Response): Promise<void> {
    const actorUserId = this.authenticatedUserId(response);
    const body = getValidated<CreateRoleRequest>(response, "body");
    const role = await this.roleService.create(actorUserId, body);
    sendSuccess(response, 201, "created", toRoleResponse(role));
  }

  async list(_request: Request, response: Response): Promise<void> {
    const roles = await this.roleService.list();
    sendSuccess(response, 200, "success", {
      items: roles.map(toRoleResponse),
      count: roles.length,
    });
  }

  async get(_request: Request, response: Response): Promise<void> {
    const { role_id } = getValidated<RolePathParams>(response, "path");
    sendSuccess(response, 200, "success", toRoleResponse(await this.roleService.get(role_id)));
  }

  async update(_request: Request, response: Response): Promise<void> {
    const actorUserId = this.authenticatedUserId(response);
    const { role_id } = getValidated<RolePathParams>(response, "path");
    const body = getValidated<UpdateRoleRequest>(response, "body");
    const role = await this.roleService.update(actorUserId, role_id, body);
    sendSuccess(response, 200, "updated", toRoleResponse(role));
  }

  async delete(_request: Request, response: Response): Promise<void> {
    const actorUserId = this.authenticatedUserId(response);
    const { role_id } = getValidated<RolePathParams>(response, "path");
    await this.roleService.softDelete(actorUserId, role_id);
    sendSuccess(response, 200, "deleted", null);
  }

  async changeUserRole(_request: Request, response: Response): Promise<void> {
    const { user_id } = getValidated<UserRolePathParams>(response, "path");
    const { role_id } = getValidated<ChangeUserRoleRequest>(response, "body");
    const actorUserId = this.authenticatedUserId(response);
    await this.roleService.changeUserRole(actorUserId, user_id, role_id);
    sendSuccess(response, 200, "updated", { user_id, role_id });
  }

  private authenticatedUserId(response: Response): string {
    const userId = getRequestContext(response).authenticatedUserId;
    if (userId === null) throw new Error("Authenticated user is missing from request context");
    return userId;
  }
}
