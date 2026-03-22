import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnv } from "dotenv";
import { z } from "zod";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

loadEnv({ path: resolve(currentDirectory, "../../../../.env"), quiet: true });
loadEnv({ override: true, path: resolve(currentDirectory, "../../.env"), quiet: true });

const envSchema = z.object({
  APP_NAME: z.string().min(1).default("Grammarian API"),
  APP_VERSION: z.string().min(1).default("0.1.0"),
  DATABASE_URL: z.string().min(1),
  LLM_API_KEY: z.string().min(1).optional(),
  LLM_MODEL: z.string().min(1).default("gpt-4.1-nano"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.string().url().optional(),
});

export const env = envSchema.parse({
  APP_NAME: process.env.APP_NAME,
  APP_VERSION: process.env.APP_VERSION,
  DATABASE_URL: process.env.DATABASE_URL,
  LLM_API_KEY: process.env.LLM_API_KEY,
  LLM_MODEL: process.env.LLM_MODEL,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  WEB_ORIGIN: process.env.WEB_ORIGIN,
});
