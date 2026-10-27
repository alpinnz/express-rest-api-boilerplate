import { createSchema } from "@valfuse-node/validation";
import type { ValfuseStringFieldSchema } from "@valfuse-node/validation";
import { t } from "@valfuse-node/validation";
import { createUserProfileFields } from "./user-profile.schema.js";
import {
  createCurrentPasswordField,
  createPasswordConfirmationField,
  createStrongPasswordField,
} from "./user-password.schema.js";

function text(min: number, max: number): ValfuseStringFieldSchema {
  return {
    type: "string",
    rules: [
      {
        name: "custom",
        validate: (value) => typeof value === "string",
        error: { code: "string_required", message: "invalid" },
      },
      { name: "required", error: { code: "required", message: "invalid" } },
      { name: "min", value: min, error: { code: "too_short", message: "invalid" } },
      { name: "max", value: max, error: { code: "too_long", message: "invalid" } },
    ],
  };
}
const { name, phone_number, country_code } = createUserProfileFields();
export const updateUserBodySchema = createSchema({ name, phone_number, country_code });

const currentProfileName: ValfuseStringFieldSchema = {
  type: "string",
  transform: t.trim,
  rules: [
    {
      name: "custom",
      validate: (value) =>
        value === undefined ||
        (typeof value === "string" && value.length > 0 && value.length <= 100),
      error: { code: "name_invalid", message: "invalid" },
    },
    {
      name: "refine",
      validate: (_value, values) => Object.values(values).some((value) => value !== undefined),
      error: { code: "required", message: "invalid" },
    },
  ],
};
const currentProfilePhoneNumber: ValfuseStringFieldSchema = {
  type: "string",
  rules: [
    {
      name: "custom",
      validate: (value) =>
        value === undefined || value === null || (typeof value === "string" && value.length <= 20),
      error: { code: "phone_number_invalid", message: "invalid" },
    },
  ],
};
const currentProfileCountryCode: ValfuseStringFieldSchema = {
  type: "string",
  rules: [
    {
      name: "custom",
      validate: (value) =>
        value === undefined || value === null || (typeof value === "string" && value.length <= 5),
      error: { code: "country_code_invalid", message: "invalid" },
    },
  ],
};
export const updateCurrentUserProfileBodySchema = createSchema({
  name: currentProfileName,
  phone_number: currentProfilePhoneNumber,
  country_code: currentProfileCountryCode,
});
export const deactivateCurrentUserBodySchema = createSchema({
  current_password: createCurrentPasswordField(),
});

export const changeCurrentUserPasswordBodySchema = createSchema({
  current_password: createCurrentPasswordField(),
  new_password: createStrongPasswordField(),
  confirm_new_password: createPasswordConfirmationField("new_password"),
});

const userIdText = text(1, 36);
export const userPathParamsSchema = createSchema({
  user_id: {
    ...userIdText,
    rules: [
      ...userIdText.rules,
      { name: "uuid", error: { code: "uuid_invalid", message: "Invalid UUID" } },
    ],
  },
});
function createIntegerQueryField(fallback: number, maximum: number) {
  return {
    type: "number" as const,
    transform: (value: unknown) =>
      value === undefined
        ? fallback
        : typeof value === "string" && /^\d+$/.test(value)
          ? Number(value)
          : value,
    rules: [
      {
        name: "custom" as const,
        validate: (value: unknown) => Number.isSafeInteger(value),
        error: { code: "integer_required", message: "Invalid integer" },
      },
      { name: "min" as const, value: 1, error: { code: "too_small", message: "Minimum 1" } },
      {
        name: "max" as const,
        value: maximum,
        error: { code: "too_large", message: "Maximum exceeded" },
      },
    ],
  };
}
export const userListPaginationSchema = createSchema({
  page: createIntegerQueryField(1, 10000),
  limit: createIntegerQueryField(20, 100),
});
