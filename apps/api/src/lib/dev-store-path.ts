import { fileURLToPath } from "node:url";

export const devStorePath = fileURLToPath(
  new URL("../../data/dev-store.json", import.meta.url),
);
