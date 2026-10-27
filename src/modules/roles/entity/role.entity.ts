import type { RoleProperties } from "./role.type.js";

export const ROLE_NAME_PATTERN = /^[a-z][a-z0-9_-]{0,49}$/;
export const MAX_ROLE_LEVEL = 2147483647;

export class Role {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(properties: RoleProperties) {
    if (!ROLE_NAME_PATTERN.test(properties.name))
      throw new Error("Role name must be a lowercase identifier");
    if (
      !Number.isSafeInteger(properties.level) ||
      properties.level < 1 ||
      properties.level > MAX_ROLE_LEVEL
    )
      throw new Error("Role level must be a positive integer");
    this.id = properties.id;
    this.name = properties.name;
    this.level = properties.level;
    this.createdAt = properties.createdAt;
    this.updatedAt = properties.updatedAt;
  }
}
