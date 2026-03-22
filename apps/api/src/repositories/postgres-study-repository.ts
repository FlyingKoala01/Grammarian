import { and, asc, desc, eq } from "drizzle-orm";

import type { AppLocale, LearnerProfile, StudyWord } from "@grammarian/shared";
import { normalizeAppLocale } from "@grammarian/shared";

import {
  createInitialWordReviewSchedule,
  type StoredWordReviewSchedule,
} from "../domain/word-review.js";
import { db } from "../db/client.js";
import {
  exerciseAttemptsTable,
  reviewSchedulesTable,
  usersTable,
  wordsTable,
} from "../db/schema.js";
import type {
  CreateWordInput,
  RecordExerciseAttemptInput,
  StoredExerciseAttempt,
  StudyRepository,
  UpdateWordInput,
} from "./study-repository.js";

class PostgresStudyRepository implements StudyRepository {
  async createUser(displayName: string, preferredLanguage: AppLocale) {
    const [user] = await db
      .insert(usersTable)
      .values({
        displayName: displayName.trim(),
        displayNameNormalized: normalizeDisplayName(displayName),
        preferredLanguage,
      })
      .returning();

    if (!user) {
      throw new Error("The user could not be created.");
    }

    return mapUser(user);
  }

  async findUserByDisplayName(displayName: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.displayNameNormalized, normalizeDisplayName(displayName)))
      .limit(1);

    return user ? mapUser(user) : null;
  }

  async findUserById(userId: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    return user ? mapUser(user) : null;
  }

  async updateUserPreferredLanguage(userId: string, preferredLanguage: AppLocale) {
    const [user] = await db
      .update(usersTable)
      .set({ preferredLanguage })
      .where(eq(usersTable.id, userId))
      .returning();

    return user ? mapUser(user) : null;
  }

  async listExerciseAttemptsByUserId(userId: string) {
    const attempts = await db
      .select()
      .from(exerciseAttemptsTable)
      .where(eq(exerciseAttemptsTable.userId, userId))
      .orderBy(asc(exerciseAttemptsTable.createdAt));

    return attempts.map(mapExerciseAttempt);
  }

  async listReviewSchedulesByUserId(userId: string) {
    const schedules = await db
      .select()
      .from(reviewSchedulesTable)
      .where(eq(reviewSchedulesTable.userId, userId))
      .orderBy(asc(reviewSchedulesTable.nextReviewAt));

    return schedules.map(mapReviewSchedule);
  }

  async listWordsByUserId(userId: string) {
    const words = await db
      .select()
      .from(wordsTable)
      .where(eq(wordsTable.userId, userId))
      .orderBy(desc(wordsTable.createdAt));

    return words.map(mapWord);
  }

  async createWord(input: CreateWordInput) {
    const now = new Date().toISOString();

    return db.transaction(async (transaction) => {
      const [word] = await transaction
        .insert(wordsTable)
        .values({
          createdAt: now,
          pinyinCanonical: input.pinyinCanonical,
          simplified: input.simplified,
          translation: input.translation,
          translationLanguage: input.translationLanguage,
          userId: input.userId,
        })
        .returning();

      if (!word) {
        throw new Error("The word could not be created.");
      }

      await transaction.insert(reviewSchedulesTable).values(
        serializeReviewSchedule(
          createInitialWordReviewSchedule(input.userId, word.id, now),
        ),
      );

      return mapWord(word);
    });
  }

  async updateWord(userId: string, wordId: string, input: UpdateWordInput) {
    const [word] = await db
      .update(wordsTable)
      .set({
        pinyinCanonical: input.pinyinCanonical,
        simplified: input.simplified,
        translation: input.translation,
        translationLanguage: input.translationLanguage,
      })
      .where(and(eq(wordsTable.id, wordId), eq(wordsTable.userId, userId)))
      .returning();

    return word ? mapWord(word) : null;
  }

  async findWordById(wordId: string) {
    const [word] = await db
      .select()
      .from(wordsTable)
      .where(eq(wordsTable.id, wordId))
      .limit(1);

    return word ? mapWord(word) : null;
  }

  async findWordByUserAndSimplified(userId: string, simplified: string) {
    const [word] = await db
      .select()
      .from(wordsTable)
      .where(and(eq(wordsTable.userId, userId), eq(wordsTable.simplified, simplified)))
      .limit(1);

    return word ? mapWord(word) : null;
  }

  async recordExerciseAttempt(input: RecordExerciseAttemptInput) {
    const [attempt] = await db
      .insert(exerciseAttemptsTable)
      .values({
        answer: input.answer,
        exerciseId: input.exerciseId,
        isCorrect: input.isCorrect,
        kind: input.kind,
        normalizedAnswer: input.normalizedAnswer,
        userId: input.userId,
        wordId: input.wordId,
      })
      .returning();

    if (!attempt) {
      throw new Error("The exercise attempt could not be saved.");
    }

    return mapExerciseAttempt(attempt);
  }

  async updateReviewScheduleForWord(
    userId: string,
    wordId: string,
    updater: (schedule: StoredWordReviewSchedule) => StoredWordReviewSchedule,
  ) {
    return db.transaction(async (transaction) => {
      const [existingSchedule] = await transaction
        .select()
        .from(reviewSchedulesTable)
        .where(
          and(
            eq(reviewSchedulesTable.userId, userId),
            eq(reviewSchedulesTable.wordId, wordId),
          ),
        )
        .limit(1);

      const nextSchedule = updater(
        existingSchedule
          ? mapReviewSchedule(existingSchedule)
          : createInitialWordReviewSchedule(userId, wordId),
      );

      if (existingSchedule) {
        const [updatedSchedule] = await transaction
          .update(reviewSchedulesTable)
          .set({
            failureCount: nextSchedule.failureCount,
            lastReviewedAt: nextSchedule.lastReviewedAt,
            nextReviewAt: nextSchedule.nextReviewAt,
            reviewCount: nextSchedule.reviewCount,
            successCount: nextSchedule.successCount,
            updatedAt: nextSchedule.updatedAt,
          })
          .where(eq(reviewSchedulesTable.id, existingSchedule.id))
          .returning();

        if (!updatedSchedule) {
          throw new Error("The review schedule could not be updated.");
        }

        return mapReviewSchedule(updatedSchedule);
      }

      const [createdSchedule] = await transaction
        .insert(reviewSchedulesTable)
        .values(serializeReviewSchedule(nextSchedule))
        .returning();

      if (!createdSchedule) {
        throw new Error("The review schedule could not be created.");
      }

      return mapReviewSchedule(createdSchedule);
    });
  }
}

function mapUser(row: typeof usersTable.$inferSelect): LearnerProfile {
  return {
    createdAt: normalizeDatabaseDate(row.createdAt),
    displayName: row.displayName,
    id: row.id,
    preferredLanguage: normalizeAppLocale(row.preferredLanguage),
  };
}

function mapWord(row: typeof wordsTable.$inferSelect): StudyWord {
  return {
    createdAt: normalizeDatabaseDate(row.createdAt),
    id: row.id,
    pinyinCanonical: row.pinyinCanonical,
    simplified: row.simplified,
    translation: row.translation,
    translationLanguage: normalizeAppLocale(row.translationLanguage),
    userId: row.userId,
  };
}

function mapReviewSchedule(
  row: typeof reviewSchedulesTable.$inferSelect,
): StoredWordReviewSchedule {
  return {
    createdAt: normalizeDatabaseDate(row.createdAt),
    failureCount: row.failureCount,
    id: row.id,
    lastReviewedAt: row.lastReviewedAt
      ? normalizeDatabaseDate(row.lastReviewedAt)
      : null,
    nextReviewAt: normalizeDatabaseDate(row.nextReviewAt),
    reviewCount: row.reviewCount,
    successCount: row.successCount,
    updatedAt: normalizeDatabaseDate(row.updatedAt),
    userId: row.userId,
    wordId: row.wordId,
  };
}

function serializeReviewSchedule(schedule: StoredWordReviewSchedule) {
  return {
    createdAt: schedule.createdAt,
    failureCount: schedule.failureCount,
    id: schedule.id,
    lastReviewedAt: schedule.lastReviewedAt,
    nextReviewAt: schedule.nextReviewAt,
    reviewCount: schedule.reviewCount,
    successCount: schedule.successCount,
    updatedAt: schedule.updatedAt,
    userId: schedule.userId,
    wordId: schedule.wordId,
  };
}

function mapExerciseAttempt(
  row: typeof exerciseAttemptsTable.$inferSelect,
): StoredExerciseAttempt {
  return {
    answer: row.answer,
    createdAt: normalizeDatabaseDate(row.createdAt),
    exerciseId: row.exerciseId,
    id: row.id,
    isCorrect: row.isCorrect,
    kind: row.kind as StoredExerciseAttempt["kind"],
    normalizedAnswer: row.normalizedAnswer,
    userId: row.userId,
    wordId: row.wordId,
  };
}

function normalizeDatabaseDate(value: string) {
  return new Date(value).toISOString();
}

function normalizeDisplayName(displayName: string) {
  return displayName.trim().toLowerCase();
}

export const postgresStudyRepository = new PostgresStudyRepository();
