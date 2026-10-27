import { existsSync } from "node:fs";
if (
  process.env.HUSKY !== "0" &&
  process.env.CI !== "true" &&
  process.env.NODE_ENV !== "production" &&
  existsSync(".git")
) {
  const husky = (await import("husky")).default;
  const result = husky();
  if (result) throw new Error(result);
}
export {};
