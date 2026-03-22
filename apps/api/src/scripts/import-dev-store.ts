import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { closeDatabaseConnection, db } from "../db/client.js";
import {
  exerciseAttemptsTable,
  reviewSchedulesTable,
  usersTable,
  wordsTable,
} from "../db/schema.js";

interface DevStoreExerciseAttempt {
  answer: string;
  createdAt: string;
  exerciseId: string;
  id: string;
  isCorrect: boolean;
  kind: string;
  normalizedAnswer: string;
  userId: string;
  wordId: string;
}

interface DevStoreReviewSchedule {
  createdAt: string;
  failureCount: number;
  id: string;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  reviewCount: number;
  successCount: number;
  updatedAt: string;
  userId: string;
  wordId: string;
}

interface DevStoreUser {
  createdAt: string;
  displayName: string;
  id: string;
  preferredLanguage: string;
}

interface DevStoreWord {
  createdAt: string;
  id: string;
  pinyinCanonical: string;
  simplified: string;
  translation: string;
  translationLanguage: string;
  userId: string;
}

interface DevStore {
  exerciseAttempts: DevStoreExerciseAttempt[];
  reviewSchedules: DevStoreReviewSchedule[];
  users: DevStoreUser[];
  words: DevStoreWord[];
}

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const devStorePath = resolve(currentDirectory, "../../data/dev-store.json");

async function run() {
  const fileContents = await readFile(devStorePath, "utf-8");
  const parsedStore = JSON.parse(fileContents) as Partial<DevStore>;
  const store: DevStore = {
    exerciseAttempts: parsedStore.exerciseAttempts ?? [],
    reviewSchedules: parsedStore.reviewSchedules ?? [],
    users: parsedStore.users ?? [],
    words: parsedStore.words ?? [],
  };

  await db.transaction(async (transaction) => {
    if (store.users.length > 0) {
      await transaction
        .insert(usersTable)
        .values(
          store.users.map((user) => ({
            createdAt: user.createdAt,
            displayName: user.displayName,
            displayNameNormalized: user.displayName.trim().toLowerCase(),
            id: user.id,
            preferredLanguage: user.preferredLanguage,
          })),
        )
        .onConflictDoNothing({ target: usersTable.id });
    }

    if (store.words.length > 0) {
      await transaction
        .insert(wordsTable)
        .values(store.words)
        .onConflictDoNothing({ target: wordsTable.id });
    }

    if (store.reviewSchedules.length > 0) {
      await transaction
        .insert(reviewSchedulesTable)
        .values(store.reviewSchedules)
        .onConflictDoNothing({ target: reviewSchedulesTable.id });
    }

    if (store.exerciseAttempts.length > 0) {
      await transaction
        .insert(exerciseAttemptsTable)
        .values(store.exerciseAttempts)
        .onConflictDoNothing({ target: exerciseAttemptsTable.id });
    }
  });

  console.log(
    `Imported ${store.users.length} users, ${store.words.length} words, ${store.reviewSchedules.length} review schedules, and ${store.exerciseAttempts.length} exercise attempts from the dev store.`,
  );
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });
