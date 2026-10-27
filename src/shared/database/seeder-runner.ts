import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Sequelize } from "sequelize";
import type { Environment } from "../../config/environment.type.js";
import type { SeederModule } from "./seeder.type.js";

export async function runSeeders(
  database: Sequelize,
  environment: Environment["nodeEnv"],
): Promise<string[]> {
  const directory = fileURLToPath(new URL("../../../seeders/", import.meta.url));
  const extension = import.meta.url.endsWith(".ts") ? "ts" : "js";
  const seederSuffix = `.seeder.${extension}`;
  const seederFiles = (await readdir(directory))
    .filter((file) => file.endsWith(seederSuffix))
    .sort();
  const seeders: Array<{ name: string; seed: SeederModule["seed"] }> = [];

  for (const file of seederFiles) {
    if (!/^\d{12}-[a-z0-9-]+\.seeder\.(ts|js)$/.test(file))
      throw new Error(`Invalid seeder file name: ${file}`);

    const seederPath = path.resolve(directory, file);
    const seederModule = (await import(pathToFileURL(seederPath).href)) as SeederModule;
    if (seederModule.environments.includes(environment))
      seeders.push({ name: file.replace(`.seeder.${extension}`, ""), seed: seederModule.seed });
  }

  await database.transaction(async (transaction) => {
    for (const seeder of seeders) {
      await seeder.seed({ context: { database, transaction } });
    }
  });

  return seeders.map(({ name }) => name);
}
