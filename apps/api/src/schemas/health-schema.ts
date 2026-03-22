import { z } from "zod";

export const healthResponseSchema = z.object({
  appName: z.string().min(1),
  environment: z.enum(["development", "test", "production"]),
  service: z.literal("api"),
  status: z.literal("ok"),
  timestamp: z.string().datetime(),
  uptimeSeconds: z.number().int().nonnegative(),
  version: z.string().min(1),
});

