import { readFile, writeFile } from "node:fs/promises";
const source = await readFile("docs/api/openapi.yaml", "utf8");
const fence = String.fromCharCode(96).repeat(3);
const content =
  "# OpenAPI Contract\n\nSource of truth: docs/api/openapi.yaml. Generated; do not edit manually.\n\n" +
  fence +
  "yaml\n" +
  source.trimEnd() +
  "\n" +
  fence +
  "\n";
const target = "docs/api/openapi.md";
if (process.argv.includes("--check")) {
  if ((await readFile(target, "utf8").catch(() => "")) !== content)
    throw new Error("Stale docs: npm run api:generate");
} else await writeFile(target, content);
