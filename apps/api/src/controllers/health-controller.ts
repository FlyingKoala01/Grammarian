import type { Request, Response } from "express";

import { healthResponseSchema } from "../schemas/health-schema.js";
import { healthService } from "../services/health-service.js";

export function getHealth(_request: Request, response: Response) {
  const healthSnapshot = healthResponseSchema.parse(healthService.getHealth());

  response.json(healthSnapshot);
}

