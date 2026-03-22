import { z } from "zod";

export const createWordBodySchema = z.object({
  pinyinCanonical: z.string().trim().min(2).max(60),
  simplified: z.string().trim().min(1).max(32),
  translation: z.string().trim().min(1).max(120),
});

export const updateWordBodySchema = createWordBodySchema;

export const wordParamsSchema = z.object({
  userId: z.uuid(),
  wordId: z.uuid(),
});

export const normalizeWordBodySchema = z.object({
  sourceText: z.string().trim().min(1).max(280),
});

export const suggestWordBodySchema = z.object({
  draft: z
    .object({
      pinyinCanonical: z.string().trim().max(60).optional(),
      simplified: z.string().trim().max(32).optional(),
      translation: z.string().trim().max(120).optional(),
    })
    .refine(
      (draft) =>
        Boolean(
          draft.simplified?.trim() ||
            draft.pinyinCanonical?.trim() ||
            draft.translation?.trim(),
        ),
      "At least one field is required to request suggestions.",
    ),
  mode: z.enum(["deterministic", "hybrid"]).optional(),
});
