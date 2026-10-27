import type { ValfuseStringFieldSchema } from "@valfuse-node/validation";
import { t } from "@valfuse-node/validation";

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

export function createUserProfileFields() {
  const name = { ...text(1, 100), transform: t.trim };
  const emailText = text(1, 254);
  const email: ValfuseStringFieldSchema = {
    ...emailText,
    transform: t.pipe(t.trim, t.toLowerCase),
    rules: [
      ...emailText.rules,
      { name: "email", error: { code: "email_invalid", message: "invalid" } },
    ],
  };
  const phoneNumber: ValfuseStringFieldSchema = {
    type: "string",
    transform: (value) => (value === undefined ? null : value),
    rules: [
      {
        name: "custom",
        validate: (value) => value === null || (typeof value === "string" && value.length <= 20),
        error: { code: "phone_number_invalid", message: "invalid" },
      },
    ],
  };
  const countryCode: ValfuseStringFieldSchema = {
    type: "string",
    transform: (value) => (value === undefined ? null : value),
    rules: [
      {
        name: "custom",
        validate: (value) => value === null || (typeof value === "string" && value.length <= 5),
        error: { code: "country_code_invalid", message: "invalid" },
      },
    ],
  };
  return { name, email, phone_number: phoneNumber, country_code: countryCode };
}
