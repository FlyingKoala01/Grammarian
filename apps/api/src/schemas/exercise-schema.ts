import { documentedExerciseTypes } from "@grammarian/shared";
import { z } from "zod";

export const getNextWordExerciseQuerySchema = z.object({
  exerciseType: z.enum(documentedExerciseTypes).optional(),
});

export const submitWordExerciseBodySchema = z.object({
  answer: z.string().trim().min(1).max(120),
  exerciseId: z.string().trim().min(3).max(120),
});
