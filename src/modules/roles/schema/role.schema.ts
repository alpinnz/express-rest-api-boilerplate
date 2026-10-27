import { createSchema, t } from "@valfuse-node/validation";
import type { ValfuseNumberFieldSchema, ValfuseStringFieldSchema } from "@valfuse-node/validation";
import { MAX_ROLE_LEVEL, ROLE_NAME_PATTERN } from "../entity/role.entity.js";

function roleNameField(required: boolean): ValfuseStringFieldSchema {
  return {
    type: "string",
    transform: t.trim,
    rules: [
      ...(required
        ? [{ name: "required" as const, error: { code: "required", message: "invalid" } }]
        : []),
      {
        name: "custom",
        validate: (value) =>
          value === undefined || (typeof value === "string" && ROLE_NAME_PATTERN.test(value)),
        error: { code: "role_name_invalid", message: "invalid" },
      },
      ...(required
        ? []
        : [
            {
              name: "refine" as const,
              validate: (_value: unknown, values: Record<string, unknown>) =>
                values.name !== undefined || values.level !== undefined,
              error: { code: "required", message: "invalid" },
            },
          ]),
    ],
  };
}

function roleLevelField(required: boolean): ValfuseNumberFieldSchema {
  return {
    type: "number",
    rules: [
      ...(required
        ? [{ name: "required" as const, error: { code: "required", message: "invalid" } }]
        : []),
      {
        name: "custom",
        validate: (value) =>
          value === undefined ||
          (typeof value === "number" &&
            Number.isSafeInteger(value) &&
            value > 0 &&
            value <= MAX_ROLE_LEVEL),
        error: { code: "role_level_invalid", message: "invalid" },
      },
    ],
  };
}
function uuidField(): ValfuseStringFieldSchema {
  return {
    type: "string",
    rules: [
      { name: "required", error: { code: "required", message: "invalid" } },
      { name: "uuid", error: { code: "uuid_invalid", message: "invalid" } },
    ],
  };
}

export const changeUserRoleBodySchema = createSchema({ role_id: uuidField() });
export const userRolePathParamsSchema = createSchema({ user_id: uuidField() });
export const rolePathParamsSchema = createSchema({ role_id: uuidField() });
export const createRoleBodySchema = createSchema({
  name: roleNameField(true),
  level: roleLevelField(true),
});
export const updateRoleBodySchema = createSchema({
  name: roleNameField(false),
  level: roleLevelField(false),
});
