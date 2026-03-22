import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import { closeDatabaseConnection, db } from "../db/client.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

async function run() {
  await migrate(db, {
    migrationsFolder: resolve(currentDirectory, "../../drizzle"),
  });

  console.log("Database migrations applied.");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });
