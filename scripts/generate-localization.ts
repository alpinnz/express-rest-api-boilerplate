import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { compileProject, loadConfig } from "@valfuse-node/localization";

const config = await loadConfig(process.cwd());
const compiled = await compileProject(process.cwd(), config);
const errors = compiled.diagnostics.filter((item) => item.severity === "error");
if (errors.length) throw new Error(JSON.stringify(errors));
const entry = compiled.runtimeEntryFile
  .replaceAll("./localization.types", "./localization.type")
  .replace(
    /from (["'])(\.[^"']+)\1/g,
    (_match: string, quote: string, specifier: string) =>
      "from " + quote + (specifier.endsWith(".js") ? specifier : specifier + ".js") + quote,
  );
const outputs = [
  [config.generated.runtime_entry_file, entry],
  [config.generated.runtime_types_file, compiled.runtimeTypesFile],
] as const;
for (const [name, content] of outputs) {
  const target = path.join(config.output_dir, name);
  if (process.argv.includes("--check")) {
    if ((await readFile(target, "utf8").catch(() => "")) !== content)
      throw new Error("Stale localization: npm run i18n:generate");
  } else {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
}
