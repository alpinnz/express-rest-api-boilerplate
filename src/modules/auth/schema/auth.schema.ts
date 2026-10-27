import { createSchema } from "@valfuse-node/validation";
import type { ValfuseStringFieldSchema } from "@valfuse-node/validation";
import { createUserProfileFields } from "../../users/schema/user-profile.schema.js";
import {
  createCurrentPasswordField,
  createPasswordConfirmationField,
  createStrongPasswordField,
} from "../../users/schema/user-password.schema.js";

function tokenText(): ValfuseStringFieldSchema {
  return {
    type: "string",
    rules: [
      {
        name: "custom",
        validate: (value) => typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value),
        error: { code: "token_invalid", message: "invalid" },
      },
      { name: "required", error: { code: "required", message: "invalid" } },
    ],
  };
}

export const registerUserBodySchema = createSchema({
  ...createUserProfileFields(),
  password: createStrongPasswordField(),
  confirm_password: createPasswordConfirmationField("password"),
});

export const loginBodySchema = createSchema({
  email: createUserProfileFields().email,
  password: createCurrentPasswordField(),
  remember_me: {
    type: "boolean",
    transform: (value: unknown) => (value === undefined ? false : value),
    rules: [
      {
        name: "custom",
        validate: (value: unknown) => typeof value === "boolean",
        error: { code: "boolean_required", message: "invalid" },
      },
    ],
  },
});

export const refreshTokenBodySchema = createSchema({ refresh_token: tokenText() });
export const logoutBodySchema = createSchema({ refresh_token: tokenText() });
