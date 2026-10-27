import type { ValfuseStringFieldSchema } from "@valfuse-node/validation";

export function createCurrentPasswordField(): ValfuseStringFieldSchema {
  return {
    type: "string",
    rules: [
      {
        name: "custom",
        validate: (value) => typeof value === "string",
        error: { code: "string_required", message: "invalid" },
      },
      { name: "required", error: { code: "required", message: "invalid" } },
      { name: "min", value: 8, error: { code: "too_short", message: "invalid" } },
      { name: "max", value: 72, error: { code: "too_long", message: "invalid" } },
    ],
  };
}

export function createStrongPasswordField(): ValfuseStringFieldSchema {
  return {
    ...createCurrentPasswordField(),
    rules: [
      ...createCurrentPasswordField().rules,
      {
        name: "regex",
        value: /[A-Z]/,
        error: { code: "password_uppercase_required", message: "invalid" },
      },
      {
        name: "regex",
        value: /[0-9]/,
        error: { code: "password_number_required", message: "invalid" },
      },
      {
        name: "regex",
        value: /[^A-Za-z0-9\s]/,
        error: { code: "password_symbol_required", message: "invalid" },
      },
    ],
  };
}

export function createPasswordConfirmationField(matchField: string): ValfuseStringFieldSchema {
  const passwordField = createStrongPasswordField();
  return {
    ...passwordField,
    rules: [
      ...passwordField.rules,
      {
        name: "matchField",
        value: matchField,
        error: { code: "password_mismatch", message: "invalid" },
      },
    ],
  };
}
