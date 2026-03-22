import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

import {
  defaultAppLocale,
  normalizeAppLocale,
  type AppLocale,
  type LearnerProfile,
  type StudyWord,
  type WordExerciseKind,
} from "@grammarian/shared";

import { normalizeStoredPinyin } from "../domain/word-intake.js";
import {
  createInitialWordReviewSchedule,
  type StoredWordReviewSchedule,
} from "../domain/word-review.js";
import { devStorePath } from "../lib/dev-store-path.js";

interface StoredExerciseAttempt {
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

interface DevStore {
  exerciseAttempts: StoredExerciseAttempt[];
  reviewSchedules: StoredWordReviewSchedule[];
  users: LearnerProfile[];
  words: StudyWord[];
}

const emptyStore: DevStore = {
  exerciseAttempts: [],
  reviewSchedules: [],
  users: [],
  words: [],
};

class DevStoreRepository {
  private writeQueue = Promise.resolve();

  async createUser(displayName: string, preferredLanguage: AppLocale) {
    const now = new Date().toISOString();
    const user: LearnerProfile = {
      createdAt: now,
      displayName,
      id: randomUUID(),
      preferredLanguage,
    };

    return this.updateStore((store) => {
      store.users.push(user);
      return user;
    });
  }

  async findUserByDisplayName(displayName: string) {
    const store = await this.readStore();

    return (
      store.users.find(
        (user) =>
          normalizeDisplayName(user.displayName) ===
          normalizeDisplayName(displayName),
      ) ?? null
    );
  }

  async findUserById(userId: string) {
    const store = await this.readStore();

    return store.users.find((user) => user.id === userId) ?? null;
  }

  async updateUserPreferredLanguage(userId: string, preferredLanguage: AppLocale) {
    return this.updateStore((store) => {
      const userIndex = store.users.findIndex((user) => user.id === userId);

      if (userIndex === -1) {
        return null;
      }

      const existingUser = store.users[userIndex];

      if (!existingUser) {
        return null;
      }

      const updatedUser: LearnerProfile = {
        ...existingUser,
        preferredLanguage,
      };

      store.users[userIndex] = updatedUser;

      return updatedUser;
    });
  }

  async listExerciseAttemptsByUserId(userId: string) {
    const store = await this.readStore();

    return store.exerciseAttempts
      .filter((attempt) => attempt.userId === userId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async listReviewSchedulesByUserId(userId: string) {
    const store = await this.readStore();

    return store.reviewSchedules
      .filter((schedule) => schedule.userId === userId)
      .sort((left, right) => left.nextReviewAt.localeCompare(right.nextReviewAt));
  }

  async listWordsByUserId(userId: string) {
    const store = await this.readStore();

    return store.words
      .filter((word) => word.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async createWord(input: {
    pinyinCanonical: string;
    simplified: string;
    translation: string;
    translationLanguage: AppLocale;
    userId: string;
  }) {
    const now = new Date().toISOString();
    const word: StudyWord = {
      createdAt: now,
      id: randomUUID(),
      pinyinCanonical: input.pinyinCanonical,
      simplified: input.simplified,
      translation: input.translation,
      translationLanguage: input.translationLanguage,
      userId: input.userId,
    };
    const reviewSchedule = createInitialWordReviewSchedule(input.userId, word.id, now);

    return this.updateStore((store) => {
      store.words.push(word);
      store.reviewSchedules.push(reviewSchedule);
      return word;
    });
  }

  async updateWord(
    userId: string,
    wordId: string,
    input: {
      pinyinCanonical: string;
      simplified: string;
      translation: string;
      translationLanguage: AppLocale;
    },
  ) {
    return this.updateStore((store) => {
      const wordIndex = store.words.findIndex(
        (word) => word.userId === userId && word.id === wordId,
      );

      if (wordIndex === -1) {
        return null;
      }

      const existingWord = store.words[wordIndex];

      if (!existingWord) {
        return null;
      }

      const updatedWord: StudyWord = {
        ...existingWord,
        pinyinCanonical: input.pinyinCanonical,
        simplified: input.simplified,
        translation: input.translation,
        translationLanguage: input.translationLanguage,
      };

      store.words[wordIndex] = updatedWord;

      return updatedWord;
    });
  }

  async findWordById(wordId: string) {
    const store = await this.readStore();

    return store.words.find((word) => word.id === wordId) ?? null;
  }

  async findWordByUserAndSimplified(userId: string, simplified: string) {
    const store = await this.readStore();

    return (
      store.words.find(
        (word) =>
          word.userId === userId &&
          word.simplified === simplified,
      ) ?? null
    );
  }

  async recordExerciseAttempt(input: {
    answer: string;
    exerciseId: string;
    isCorrect: boolean;
    kind: WordExerciseKind;
    normalizedAnswer: string;
    userId: string;
    wordId: string;
  }) {
    const attempt: StoredExerciseAttempt = {
      answer: input.answer,
      createdAt: new Date().toISOString(),
      exerciseId: input.exerciseId,
      id: randomUUID(),
      isCorrect: input.isCorrect,
      kind: input.kind,
      normalizedAnswer: input.normalizedAnswer,
      userId: input.userId,
      wordId: input.wordId,
    };

    return this.updateStore((store) => {
      store.exerciseAttempts.push(attempt);
      return attempt;
    });
  }

  async updateReviewScheduleForWord(
    userId: string,
    wordId: string,
    updater: (schedule: StoredWordReviewSchedule) => StoredWordReviewSchedule,
  ) {
    return this.updateStore((store) => {
      const scheduleIndex = store.reviewSchedules.findIndex(
        (schedule) => schedule.userId === userId && schedule.wordId === wordId,
      );

      if (scheduleIndex === -1) {
        const nextSchedule = updater(
          createInitialWordReviewSchedule(userId, wordId),
        );

        store.reviewSchedules.push(nextSchedule);
        return nextSchedule;
      }

      const existingSchedule = store.reviewSchedules[scheduleIndex];

      if (!existingSchedule) {
        throw new Error("The review schedule could not be loaded for update.");
      }

      const nextSchedule = updater(existingSchedule);
      store.reviewSchedules[scheduleIndex] = nextSchedule;

      return nextSchedule;
    });
  }

  private async readStore() {
    await this.ensureStoreExists();

    const fileContents = await readFile(devStorePath, "utf-8");
    const parsedStore = JSON.parse(fileContents) as Partial<DevStore>;
    const normalizedStore = {
      exerciseAttempts: parsedStore.exerciseAttempts ?? [],
      reviewSchedules: parsedStore.reviewSchedules ?? [],
      users: (parsedStore.users ?? []).map((user) => ({
        ...user,
        preferredLanguage: normalizeAppLocale(user.preferredLanguage),
      })),
      words: (parsedStore.words ?? []).map((word) => ({
        ...word,
        pinyinCanonical: normalizeStoredPinyin(word.pinyinCanonical),
        translationLanguage: normalizeAppLocale(word.translationLanguage),
      })),
    } satisfies DevStore;

    for (const word of normalizedStore.words) {
      const hasSchedule = normalizedStore.reviewSchedules.some(
        (schedule) => schedule.userId === word.userId && schedule.wordId === word.id,
      );

      if (!hasSchedule) {
        normalizedStore.reviewSchedules.push(
          createInitialWordReviewSchedule(word.userId, word.id, word.createdAt),
        );
      }
    }

    if (JSON.stringify(normalizedStore) !== JSON.stringify({
      exerciseAttempts: parsedStore.exerciseAttempts ?? [],
      reviewSchedules: parsedStore.reviewSchedules ?? [],
      users: parsedStore.users ?? [],
      words: parsedStore.words ?? [],
    })) {
      await writeFile(devStorePath, JSON.stringify(normalizedStore, null, 2));
    }

    return normalizedStore;
  }

  private async ensureStoreExists() {
    await mkdir(dirname(devStorePath), { recursive: true });

    try {
      await readFile(devStorePath, "utf-8");
    } catch {
      await writeFile(devStorePath, JSON.stringify(emptyStore, null, 2));
    }
  }

  private async updateStore<T>(updater: (store: DevStore) => T | Promise<T>) {
    const operation = this.writeQueue.then(async () => {
      const store = await this.readStore();
      const result = await updater(store);

      await writeFile(devStorePath, JSON.stringify(store, null, 2));

      return result;
    });

    this.writeQueue = operation.then(
      () => undefined,
      () => undefined,
    );

    return operation;
  }
}

function normalizeDisplayName(displayName: string) {
  return displayName.trim().toLowerCase();
}

export const devStoreRepository = new DevStoreRepository();
