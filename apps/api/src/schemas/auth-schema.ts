import { appLocales } from "@grammarian/shared";
import { z } from "zod";

export const demoLoginBodySchema = z.object({
  displayName: z.string().trim().min(2).max(40),
  preferredLanguage: z.enum(appLocales),
});
