import { appLocales } from "@grammarian/shared";
import { z } from "zod";

export const userParamsSchema = z.object({
  userId: z.uuid(),
});

export const updateUserPreferencesBodySchema = z.object({
  preferredLanguage: z.enum(appLocales),
});
