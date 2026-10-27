import { constants, copyFileSync } from "node:fs";

for (const destination of [".env", ".env.test"]) {
  try {
    copyFileSync(destination + ".example", destination, constants.COPYFILE_EXCL);
    console.log("Created " + destination);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
      console.log("Kept existing " + destination);
    } else throw error;
  }
}
