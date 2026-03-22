import type { Request, Response } from "express";

import { authService } from "../services/auth-service.js";
import { demoLoginBodySchema } from "../schemas/auth-schema.js";

export async function demoLogin(request: Request, response: Response) {
  const body = demoLoginBodySchema.parse(request.body);
  const loginResponse = await authService.demoLogin(
    body.displayName,
    body.preferredLanguage,
  );

  response.json(loginResponse);
}
