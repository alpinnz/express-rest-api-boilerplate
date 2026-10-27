import type { Response } from "express";
import type { RequestContext, InputLocation, Localizer } from "./http.type.js";
export function getRequestContext(response: Response): RequestContext {
  return response.locals.requestContext as RequestContext;
}
export function getLocalizer(response: Response): Localizer {
  return response.locals.localization as Localizer;
}
export function getValidated<TValidated>(response: Response, location: InputLocation): TValidated {
  return getRequestContext(response).validated[location] as TValidated;
}
