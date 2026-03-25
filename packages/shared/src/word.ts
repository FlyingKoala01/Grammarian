import type { AppLocale } from "./locale.js";

export interface StudyWord {
  id: string;
  userId: string;
  simplified: string;
  pinyinCanonical: string;
  translation: string;
  translationLanguage: AppLocale;
  createdAt: string;
}

export interface WordDraft {
  simplified: string;
  pinyinCanonical: string;
  translation: string;
}

export interface CreateWordRequest extends WordDraft {}

export interface UpdateWordRequest extends WordDraft {}

export type WordValidationStatus =
  | "verified"
  | "corrected"
  | "unverified";

export interface WordValidationResult {
  correctedFields: WordDraftField[];
  model: string | null;
  notes: string[];
  status: WordValidationStatus;
}

export interface CreateWordResponse {
  validation: WordValidationResult;
  word: StudyWord;
}

export interface UpdateWordResponse {
  validation: WordValidationResult;
  word: StudyWord;
}

export interface ListWordsResponse {
  words: StudyWord[];
}

export type WordDraftField = keyof WordDraft;

export type WordNormalizationMode =
  | "deterministic"
  | "hybrid"
  | "llm_assisted";

export interface NormalizeWordRequest {
  sourceText: string;
}

export interface NormalizeWordResponse {
  draft: WordDraft;
  missingFields: WordDraftField[];
  mode: WordNormalizationMode;
  model: string | null;
  notes: string[];
}

export interface SuggestWordDraftRequest {
  draft: Partial<WordDraft>;
  mode?: "deterministic" | "hybrid";
}

export interface WordFieldSuggestions {
  simplified: string[];
  pinyinCanonical: string[];
  translation: string[];
}

export interface SuggestWordDraftResponse {
  draft: WordDraft;
  missingFields: WordDraftField[];
  mode: WordNormalizationMode;
  model: string | null;
  notes: string[];
  suggestions: WordFieldSuggestions;
}
