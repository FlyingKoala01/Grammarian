import type {
  AppLocale,
  LearnerProfile,
  StudyWord,
  WordExerciseKind,
} from "@grammarian/shared";

import type { StoredWordReviewSchedule } from "../domain/word-review.js";

export interface StoredExerciseAttempt {
  answer: string;
  createdAt: string;
  exerciseId: string;
  id: string;
  isCorrect: boolean;
  kind: WordExerciseKind;
  normalizedAnswer: string;
  userId: string;
  wordId: string;
}

export interface CreateWordInput {
  pinyinCanonical: string;
  simplified: string;
  translation: string;
  translationLanguage: AppLocale;
  userId: string;
}

export interface UpdateWordInput {
  pinyinCanonical: string;
  simplified: string;
  translation: string;
  translationLanguage: AppLocale;
}

export interface RecordExerciseAttemptInput {
  answer: string;
  exerciseId: string;
  isCorrect: boolean;
  kind: WordExerciseKind;
  normalizedAnswer: string;
  userId: string;
  wordId: string;
}

export interface StudyRepository {
  createUser(displayName: string, preferredLanguage: AppLocale): Promise<LearnerProfile>;
  createWord(input: CreateWordInput): Promise<StudyWord>;
  findUserByDisplayName(displayName: string): Promise<LearnerProfile | null>;
  findUserById(userId: string): Promise<LearnerProfile | null>;
  findWordById(wordId: string): Promise<StudyWord | null>;
  findWordByUserAndSimplified(
    userId: string,
    simplified: string,
  ): Promise<StudyWord | null>;
  listExerciseAttemptsByUserId(userId: string): Promise<StoredExerciseAttempt[]>;
  listReviewSchedulesByUserId(userId: string): Promise<StoredWordReviewSchedule[]>;
  listWordsByUserId(userId: string): Promise<StudyWord[]>;
  recordExerciseAttempt(
    input: RecordExerciseAttemptInput,
  ): Promise<StoredExerciseAttempt>;
  updateReviewScheduleForWord(
    userId: string,
    wordId: string,
    updater: (schedule: StoredWordReviewSchedule) => StoredWordReviewSchedule,
  ): Promise<StoredWordReviewSchedule>;
  updateUserPreferredLanguage(
    userId: string,
    preferredLanguage: AppLocale,
  ): Promise<LearnerProfile | null>;
  updateWord(
    userId: string,
    wordId: string,
    input: UpdateWordInput,
  ): Promise<StudyWord | null>;
}
