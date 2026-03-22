import { describe, expect, it } from "vitest";

import type { StudyWord } from "@grammarian/shared";

import {
  buildNextWordExercise,
  evaluateWordExercise,
} from "../src/domain/word-exercise.js";
import { createInitialWordReviewSchedule } from "../src/domain/word-review.js";

function buildWord(overrides: Partial<StudyWord> = {}): StudyWord {
  return {
    createdAt: "2026-03-22T10:00:00.000Z",
    id: "word-1",
    pinyinCanonical: "xue2 xi2",
    simplified: "学习",
    translation: "to study",
    translationLanguage: "en",
    userId: "user-1",
    ...overrides,
  };
}

describe("word exercise flow", () => {
  it("prefers due words when choosing the next exercise", () => {
    const dueWord = buildWord({
      createdAt: "2026-03-22T09:00:00.000Z",
      id: "word-due",
      simplified: "你好",
      pinyinCanonical: "ni3 hao3",
      translation: "hello",
    });
    const scheduledWord = buildWord({
      createdAt: "2026-03-22T10:00:00.000Z",
      id: "word-later",
      simplified: "谢谢",
      pinyinCanonical: "xie4 xie",
      translation: "thanks",
    });

    const dueSchedule = createInitialWordReviewSchedule(
      "user-1",
      dueWord.id,
      "2026-03-22T09:00:00.000Z",
    );
    const scheduledSchedule = {
      ...createInitialWordReviewSchedule(
        "user-1",
        scheduledWord.id,
        "2026-03-22T10:00:00.000Z",
      ),
      nextReviewAt: "2099-03-22T10:00:00.000Z",
    };

    const exercise = buildNextWordExercise(
      [dueWord, scheduledWord],
      [],
      [scheduledSchedule, dueSchedule],
      "en",
    );

    expect(exercise.wordId).toBe(dueWord.id);
  });

  it("accepts pinyin answers written with tone marks", () => {
    const word = buildWord();

    const result = evaluateWordExercise("pinyin:word-1", "xué xí", word);

    expect(result.isCorrect).toBe(true);
    expect(result.normalizedAnswer).toBe("xue2xi2");
    expect(result.idealAnswer).toBe("xue2 xi2");
  });

  it("accepts recognition answers without the english infinitive prefix", () => {
    const word = buildWord();

    const result = evaluateWordExercise("recognition:word-1", "study", word);

    expect(result.isCorrect).toBe(true);
    expect(result.idealAnswer).toBe("to study");
  });
});
