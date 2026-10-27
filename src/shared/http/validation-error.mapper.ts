import type { ErrorDetail } from "../errors/application-error.type.js";
import type { ValidationError } from "../errors/validation-error.js";
import type { Localizer } from "./http.type.js";

const messageKeys: Record<string, string> = {
  credentials_invalid: "common.invalidCredentials",
  refresh_token_invalid: "common.invalidRefreshToken",
  current_password_invalid: "common.currentPasswordInvalid",
  boolean_required: "common.booleanRequired",
  string_required: "common.stringRequired",
  required: "common.fieldRequired",
  name_invalid: "common.nameInvalid",
  too_short: "common.valueTooShort",
  too_long: "common.valueTooLong",
  email_invalid: "common.emailInvalid",
  phone_number_invalid: "common.phoneNumberInvalid",
  country_code_invalid: "common.countryCodeInvalid",
  token_invalid: "common.tokenInvalid",
  password_uppercase_required: "common.passwordUppercaseRequired",
  password_number_required: "common.passwordNumberRequired",
  password_symbol_required: "common.passwordSymbolRequired",
  password_mismatch: "common.passwordMismatch",
  uuid_invalid: "common.uuidInvalid",
  role_name_invalid: "roles.roleNameInvalid",
  role_level_invalid: "roles.roleLevelInvalid",
  integer_required: "common.integerRequired",
  too_small: "common.minimumValue",
  too_large: "common.maximumValue",
};

export function getValidationErrorMessage(issueCode: string, localizer: Localizer): string {
  return localizer.translate(messageKeys[issueCode] ?? "common.invalid");
}

export function toValidationErrorDetail(error: ValidationError, localizer: Localizer): ErrorDetail {
  return {
    field: error.field,
    location: "body",
    code: error.issueCode,
    message: getValidationErrorMessage(error.issueCode, localizer),
  };
}
