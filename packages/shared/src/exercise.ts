import type { StudyProgressSummary } from "./user.js";

export const documentedExerciseTypes = [
  "character_recognition",
  "pinyin_recognition",
  "character_writing",
  "sentence_understanding",
  "gap_fill",
] as const;

export type DocumentedExerciseType = (typeof documentedExerciseTypes)[number];

export const supportedWordExerciseTypes = [
  "character_recognition",
  "pinyin_recognition",
  "character_writing",
] as const;

export type SupportedWordExerciseType = (typeof supportedWordExerciseTypes)[number];

export type WordExerciseKind = "recognition" | "writing" | "pinyin";
export type WordExerciseAnswerMode = "text" | "trace_character";

export const traceCompletedAnswerPrefix = "__trace_completed__";

export interface WordExercise {
  exerciseType: DocumentedExerciseType;
  exerciseId: string;
  kind: WordExerciseKind;
  queueMode: "due" | "scheduled";
  wordId: string;
  promptText: string;
  promptSecondaryText?: string;
  inputLabel: string;
  inputPlaceholder: string;
  answerMode: WordExerciseAnswerMode;
  traceCharacters?: string[];
}

export interface GetNextWordExerciseRequest {
  exerciseType?: DocumentedExerciseType;
}

export interface GetNextWordExerciseResponse {
  exercise: WordExercise;
  progress: StudyProgressSummary;
  availableWordCount: number;
}

export interface SubmitWordExerciseRequest {
  exerciseId: string;
  answer: string;
}

export interface ExerciseResultWord {
  simplified: string;
  pinyinCanonical: string;
  translation: string;
}

export interface WordExerciseResult {
  exerciseType: DocumentedExerciseType;
  kind: WordExerciseKind;
  isCorrect: boolean;
  normalizedAnswer: string;
  idealAnswer: string;
  feedbackShort: string;
  feedbackDetailed: string;
  word: ExerciseResultWord;
}

export interface SubmitWordExerciseResponse {
  result: WordExerciseResult;
  progress: StudyProgressSummary;
}

export function isSupportedWordExerciseType(
  exerciseType: DocumentedExerciseType,
): exerciseType is SupportedWordExerciseType {
  return supportedWordExerciseTypes.includes(
    exerciseType as SupportedWordExerciseType,
  );
}

export function buildTraceCompletedAnswer(totalMistakes = 0) {
  const safeTotalMistakes = Number.isFinite(totalMistakes)
    ? Math.max(0, Math.round(totalMistakes))
    : 0;

  return `${traceCompletedAnswerPrefix}:${safeTotalMistakes}`;
}

export function parseTraceCompletedAnswer(answer: string) {
  const trimmedAnswer = answer.trim();

  if (!trimmedAnswer.startsWith(traceCompletedAnswerPrefix)) {
    return {
      completed: false,
      totalMistakes: null,
    };
  }

  const [, totalMistakesCandidate] = trimmedAnswer.split(":");
  const totalMistakes = Number.parseInt(totalMistakesCandidate ?? "0", 10);

  return {
    completed: true,
    totalMistakes: Number.isFinite(totalMistakes) ? Math.max(0, totalMistakes) : 0,
  };
}
