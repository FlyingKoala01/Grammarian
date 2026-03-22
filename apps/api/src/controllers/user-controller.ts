import type { Request, Response } from "express";

import {
  updateUserPreferencesBodySchema,
  userParamsSchema,
} from "../schemas/user-schema.js";
import { userService } from "../services/user-service.js";

export async function getUser(request: Request, response: Response) {
  const params = userParamsSchema.parse(request.params);
  const userResponse = await userService.getUser(params.userId);

  response.json(userResponse);
}

export async function updateUserPreferences(request: Request, response: Response) {
  const params = userParamsSchema.parse(request.params);
  const body = updateUserPreferencesBodySchema.parse(request.body);
  const userResponse = await userService.updateUserPreferences(
    params.userId,
    body.preferredLanguage,
  );

  response.json(userResponse);
}
