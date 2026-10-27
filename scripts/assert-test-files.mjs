import { readdir } from "node:fs/promises";
import path from "node:path";

const testRoot = path.resolve("tests");
const groups = process.argv.slice(2);
if (groups.length === 0) throw new Error("Provide at least one test group.");

for (const group of groups) {
  const directory = path.join(testRoot, group);
  const files = (await readdir(directory, { withFileTypes: true }).catch(() => [])).filter(
    (entry) => entry.isFile() && entry.name.endsWith(".test.ts"),
  );
  if (files.length === 0) throw new Error(`No test files found in ${directory}.`);
}
