import type { Request, Response } from "express";

import {
  createWordBodySchema,
  normalizeWordBodySchema,
  suggestWordBodySchema,
  updateWordBodySchema,
  wordParamsSchema,
} from "../schemas/word-schema.js";
import { userParamsSchema } from "../schemas/user-schema.js";
import { wordIntakeService } from "../services/word-intake-service.js";
import { wordService } from "../services/word-service.js";

export async function createWord(request: Request, response: Response) {
  const params = userParamsSchema.parse(request.params);
  const body = createWordBodySchema.parse(request.body);
  const createWordResponse = await wordService.createWord(params.userId, body);

  response.status(201).json(createWordResponse);
}

export async function listWords(request: Request, response: Response) {
  const params = userParamsSchema.parse(request.params);
  const wordsResponse = await wordService.listWords(params.userId);

  response.json(wordsResponse);
}

export async function updateWord(request: Request, response: Response) {
  const params = wordParamsSchema.parse(request.params);
  const body = updateWordBodySchema.parse(request.body);
  const updateWordResponse = await wordService.updateWord(
    params.userId,
    params.wordId,
    body,
  );

  response.json(updateWordResponse);
}

export async function normalizeWord(request: Request, response: Response) {
  const params = userParamsSchema.parse(request.params);
  const body = normalizeWordBodySchema.parse(request.body);
  const normalizedWord = await wordIntakeService.normalizeWord(
    params.userId,
    body.sourceText,
  );

  response.json(normalizedWord);
}

export async function suggestWord(request: Request, response: Response) {
  const params = userParamsSchema.parse(request.params);
  const body = suggestWordBodySchema.parse(request.body);
  const suggestionResponse = await wordIntakeService.suggestWordDraft(
    params.userId,
    body.draft,
    body.mode,
  );

  response.json(suggestionResponse);
}
