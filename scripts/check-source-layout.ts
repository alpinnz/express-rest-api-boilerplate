import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const moduleRoot = path.join("src", "modules");
const featureDirectories = new Set([
  "controller",
  "entity",
  "errors",
  "middleware",
  "mapper",
  "model",
  "repository",
  "routes",
  "schema",
  "security",
  "service",
  "types",
]);
const authUserContractDependencies = new Set([
  path.join("service", "user-profile-service.type.ts"),
  path.join("schema", "user-profile.schema.ts"),
  path.join("schema", "user-password.schema.ts"),
  path.join("service", "authenticated-user-account-service.type.ts"),
  path.join("types", "user-command.type.ts"),
]);
const authRoleContractDependencies = new Set([path.join("service", "role-service.type.ts")]);
const roleUserContractDependencies = new Set([
  path.join("service", "user-role-assignment-service.type.ts"),
]);

async function visit(directory: string): Promise<void> {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    const modulePath = path.relative(moduleRoot, file);
    const isFeaturePath =
      modulePath !== ".." &&
      !modulePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(modulePath);
    const moduleParts = isFeaturePath ? modulePath.split(path.sep) : [];
    if (item.isDirectory()) {
      if (moduleParts.length === 2 && !featureDirectories.has(item.name))
        throw new Error("Use a recognized feature responsibility directory: " + file);
      if (moduleParts.length > 2)
        throw new Error("Keep feature responsibility directories one level deep: " + file);
      await visit(file);
    } else {
      if (isFeaturePath && moduleParts.length !== 3)
        throw new Error("Place feature files inside a responsibility directory: " + file);
      if (!item.name.endsWith(".ts"))
        throw new Error("src contains a non-TypeScript file: " + file);
      if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*\.ts$/.test(item.name))
        throw new Error("Invalid file naming: " + file);
      if (!file.includes(path.sep + "generated" + path.sep) && !item.name.endsWith(".type.ts")) {
        const source = await readFile(file, "utf8");
        if (/^\s*export\s+(?:interface|type)\s+/m.test(source))
          throw new Error("Move exported type declarations to *.type.ts: " + file);
      }
      if (isFeaturePath && moduleParts.length === 3) {
        const source = await readFile(file, "utf8");
        const imports = source.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g);
        for (const match of imports) {
          const specifier = match[1];
          if (!specifier) continue;
          if (!specifier.startsWith(".")) continue;
          const target = path.resolve(path.dirname(file), specifier.replace(/\.js$/, ".ts"));
          const targetPath = path.relative(moduleRoot, target);
          const targetParts = targetPath.split(path.sep);
          if (moduleParts[0] === "users" && targetParts[0] === "auth")
            throw new Error("Users must not depend on Auth: " + file + " -> " + target);
          if (moduleParts[0] === "users" && targetParts[0] === "roles")
            throw new Error("Users must not depend on Roles: " + file + " -> " + target);
          if (moduleParts[0] === "auth" && targetParts[0] === "users") {
            const userContractPath = path.join(...targetParts.slice(1));
            if (!authUserContractDependencies.has(userContractPath))
              throw new Error(
                "Auth may depend only on explicitly allowed user contracts: " +
                  file +
                  " -> " +
                  target,
              );
          }
          if (moduleParts[0] === "auth" && targetParts[0] === "roles") {
            const roleContractPath = path.join(...targetParts.slice(1));
            if (!authRoleContractDependencies.has(roleContractPath))
              throw new Error(
                "Auth may depend only on the default-role contract: " + file + " -> " + target,
              );
          }
          if (moduleParts[0] === "roles" && targetParts[0] === "users") {
            const userContractPath = path.join(...targetParts.slice(1));
            if (!roleUserContractDependencies.has(userContractPath))
              throw new Error(
                "Roles may depend only on the user role-assignment contract: " +
                  file +
                  " -> " +
                  target,
              );
          }
        }
      }
    }
  }
}
await visit("src");
