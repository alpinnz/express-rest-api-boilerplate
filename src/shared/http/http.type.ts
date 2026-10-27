import type { AwilixContainer } from "awilix";
import type { ExpressLocalization } from "@valfuse-node/express";
import type { Cradle } from "../../container.type.js";
import type { ApplicationErrorCode, ErrorDetail } from "../errors/application-error.type.js";
export type InputLocation = "body" | "query" | "path";
export type RequestContext = {
  requestId: string;
  scope: AwilixContainer<Cradle>;
  validated: Partial<Record<InputLocation, Record<string, unknown>>>;
  authenticatedUserId: string | null;
};
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  total_page: number;
  has_next: boolean;
  has_prev: boolean;
};
export type JsonValue =
  string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];
export type ApiErrors = ErrorDetail[];
export type Meta = { request_id: string; [key: string]: JsonValue };
export type PaginatedMeta = Meta & { pagination: Pagination };
export type ApiSuccessCode = "created" | "success" | "updated" | "deleted";
export type ApiSuccessResponse<TData, TMeta extends Meta = Meta> = {
  message: string;
  code: ApiSuccessCode;
  meta: TMeta;
} & (null extends TData ? { data?: Exclude<TData, null> } : { data: TData });
export type ApiFailureResponse<TErrors extends ApiErrors = ApiErrors, TMeta extends Meta = Meta> = {
  message: string;
  code: ApplicationErrorCode;
  errors?: TErrors;
  meta: TMeta;
};
export type ApiResponse<TData, TMeta extends Meta = Meta, TErrors extends ApiErrors = ApiErrors> =
  ApiSuccessResponse<TData, TMeta> | ApiFailureResponse<TErrors, TMeta>;
export type Localizer = Pick<ExpressLocalization, "translate" | "locale">;
