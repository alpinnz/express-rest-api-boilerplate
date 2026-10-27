export const DEFAULT_ROLE_NAME = "user";
export const OWNER_ROLE_LEVEL = 100;
export const ADMIN_ROLE_LEVEL = 80;

export const SYSTEM_ROLES = [
  { id: "01a17aa8-1c00-7001-8101-100000000001", name: "owner", level: OWNER_ROLE_LEVEL },
  { id: "01a17aa8-1c00-7002-8102-100000000002", name: "admin", level: ADMIN_ROLE_LEVEL },
  { id: "01a17aa8-1c00-7003-8103-100000000003", name: "staff", level: 50 },
  { id: "01a17aa8-1c00-7004-8104-100000000004", name: "user", level: 10 },
] as const;
