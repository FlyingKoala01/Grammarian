import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "users",
  {
    createdAt: timestamp("created_at", {
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    displayName: text("display_name").notNull(),
    displayNameNormalized: text("display_name_normalized").notNull(),
    id: uuid("id").primaryKey().defaultRandom(),
    preferredLanguage: text("preferred_language").notNull(),
  },
  (table) => [
    uniqueIndex("users_display_name_normalized_idx").on(table.displayNameNormalized),
  ],
);

export const wordsTable = pgTable(
  "words",
  {
    createdAt: timestamp("created_at", {
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    id: uuid("id").primaryKey().defaultRandom(),
    pinyinCanonical: text("pinyin_canonical").notNull(),
    simplified: text("simplified").notNull(),
    translation: text("translation").notNull(),
    translationLanguage: text("translation_language").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("words_user_created_at_idx").on(table.userId, table.createdAt),
    uniqueIndex("words_user_simplified_idx").on(table.userId, table.simplified),
  ],
);

export const reviewSchedulesTable = pgTable(
  "review_schedules",
  {
    createdAt: timestamp("created_at", {
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    failureCount: integer("failure_count").notNull().default(0),
    id: uuid("id").primaryKey().defaultRandom(),
    lastReviewedAt: timestamp("last_reviewed_at", {
      mode: "string",
      withTimezone: true,
    }),
    nextReviewAt: timestamp("next_review_at", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    reviewCount: integer("review_count").notNull().default(0),
    successCount: integer("success_count").notNull().default(0),
    updatedAt: timestamp("updated_at", {
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    wordId: uuid("word_id")
      .notNull()
      .references(() => wordsTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("review_schedules_user_next_review_at_idx").on(
      table.userId,
      table.nextReviewAt,
    ),
    uniqueIndex("review_schedules_user_word_idx").on(table.userId, table.wordId),
  ],
);

export const exerciseAttemptsTable = pgTable(
  "exercise_attempts",
  {
    answer: text("answer").notNull(),
    createdAt: timestamp("created_at", {
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    exerciseId: text("exercise_id").notNull(),
    id: uuid("id").primaryKey().defaultRandom(),
    isCorrect: boolean("is_correct").notNull(),
    kind: text("kind").notNull(),
    normalizedAnswer: text("normalized_answer").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    wordId: uuid("word_id")
      .notNull()
      .references(() => wordsTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("exercise_attempts_user_created_at_idx").on(table.userId, table.createdAt),
    index("exercise_attempts_word_created_at_idx").on(table.wordId, table.createdAt),
  ],
);
