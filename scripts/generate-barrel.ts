import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { generateBarrel } from "@valfuse-node/barrel";
const temporary = await mkdtemp(path.join(tmpdir(), "express-barrel-"));
try {
  const output = path.join(temporary, "index.ts");
  await generateBarrel({
    cwd: process.cwd(),
    config: {
      inputDir: "src/modules/auth/security",
      outputFile: output,
      include: ["node-argon2-password-hasher.ts"],
    },
  });
  const content = (await readFile(output, "utf8")).replace(
    /from (["'])(\.[^"']+)\1/g,
    (_match: string, quote: string, specifier: string) =>
      "from " + quote + "./" + path.basename(specifier) + ".js" + quote,
  );
  const target = "src/modules/auth/security/index.ts";
  if (process.argv.includes("--check")) {
    if ((await readFile(target, "utf8").catch(() => "")) !== content)
      throw new Error("Stale barrel: npm run barrel:generate");
  } else await writeFile(target, content);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
