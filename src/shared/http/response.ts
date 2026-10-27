import type { Response } from "express";
import type { ErrorDetail, ApplicationErrorCode } from "../errors/application-error.type.js";
import { applicationErrorDefinitions } from "../errors/application-error.definition.js";
import type {
  ApiFailureResponse,
  ApiSuccessCode,
  ApiSuccessResponse,
  Meta,
  Pagination,
  PaginatedMeta,
} from "./http.type.js";
import { getLocalizer, getRequestContext } from "./http-context.js";

const successKeys: Record<ApiSuccessCode, string> = {
  created: "common.created",
  success: "common.success",
  updated: "common.updated",
  deleted: "common.deleted",
} as const;
export function sendSuccess<TData>(
  response: Response,
  status: number,
  code: ApiSuccessCode,
  data: TData,
  pagination?: Pagination,
): void {
  const requestId = getRequestContext(response).requestId;
  const meta: Meta | PaginatedMeta = pagination
    ? { request_id: requestId, pagination }
    : { request_id: requestId };
  const body = {
    message: getLocalizer(response).translate(successKeys[code]),
    code,
    ...(data === null ? {} : { data }),
    meta,
  } as ApiSuccessResponse<TData, Meta | PaginatedMeta>;
  response.status(status).json(body);
}
export function sendFailure(
  response: Response,
  code: ApplicationErrorCode,
  details: ErrorDetail[] | null = null,
): void {
  const definition = applicationErrorDefinitions[code];
  const body: ApiFailureResponse<ErrorDetail[]> = {
    message: getLocalizer(response).translate(definition.messageKey),
    code,
    ...(details && details.length > 0 ? { errors: details } : {}),
    meta: { request_id: getRequestContext(response).requestId },
  };
  response.status(definition.status).json(body);
}
