import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { env } from "../lib/env.js";
import * as schema from "./schema.js";

export const sqlClient = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === "test" ? 1 : 10,
});

export const db = drizzle(sqlClient, { schema });

export async function closeDatabaseConnection() {
  await sqlClient.end();
}
