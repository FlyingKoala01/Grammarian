import { describe, expect, it } from "vitest";

import type { StudyWord } from "@grammarian/shared";

import {
  buildNextWordExercise,
  evaluateWordExercise,
} from "../src/domain/word-exercise.js";

function buildWord(overrides: Partial<StudyWord> = {}): StudyWord {
  return {
    createdAt: "2026-03-22T10:00:00.000Z",
    id: "word-1",
    pinyinCanonical: "xue2 xi2",
    simplified: "\u5b66\u4e60",
    translation: "to study",
    translationLanguage: "en",
    userId: "user-1",
    ...overrides,
  };
}

describe("word exercise flow", () => {
  it("prefers the oldest least-practiced word when choosing the next exercise", () => {
    const olderWord = buildWord({
      createdAt: "2026-03-22T09:00:00.000Z",
      id: "word-older",
      simplified: "\u4f60\u597d",
      pinyinCanonical: "ni3 hao3",
      translation: "hello",
    });
    const newerWord = buildWord({
      createdAt: "2026-03-22T10:00:00.000Z",
      id: "word-newer",
      simplified: "\u8c22\u8c22",
      pinyinCanonical: "xie4 xie",
      translation: "thanks",
    });

    const exercise = buildNextWordExercise(
      [newerWord, olderWord],
      [],
      "en",
    );

    expect(exercise.wordId).toBe(olderWord.id);
  });

  it("accepts pinyin answers written with tone marks", () => {
    const word = buildWord();

    const result = evaluateWordExercise("pinyin:word-1", "xu\u00e9 x\u00ed", word);

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
