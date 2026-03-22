import type { Request, Response } from "express";

import {
  getNextWordExerciseQuerySchema,
  submitWordExerciseBodySchema,
} from "../schemas/exercise-schema.js";
import { userParamsSchema } from "../schemas/user-schema.js";
import { exerciseService } from "../services/exercise-service.js";

export async function getNextWordExercise(request: Request, response: Response) {
  const params = userParamsSchema.parse(request.params);
  const query = getNextWordExerciseQuerySchema.parse(request.query);
  const exerciseResponse = await exerciseService.getNextWordExercise(
    params.userId,
    query.exerciseType,
  );

  response.json(exerciseResponse);
}

export async function submitWordExercise(request: Request, response: Response) {
  const params = userParamsSchema.parse(request.params);
  const body = submitWordExerciseBodySchema.parse(request.body);
  const submissionResponse = await exerciseService.submitWordExercise(
    params.userId,
    body,
  );

  response.json(submissionResponse);
}
