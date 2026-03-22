import type {
  WordDraft,
  WordDraftField,
} from "@grammarian/shared";
import {
  hasPinyinToneInformation,
  normalizePinyinForStorage,
} from "@grammarian/shared";

export function buildDeterministicWordDraft(sourceText: string): WordDraft {
  const cleanedSourceText = collapseSpaces(sourceText);

  if (!cleanedSourceText) {
    return emptyWordDraft();
  }

  const segments = splitSourceText(cleanedSourceText);
  const draft = emptyWordDraft();

  for (const segment of segments) {
    if (!draft.simplified && containsHanzi(segment)) {
      draft.simplified = normalizeStoredChinese(
        segment.match(/[\p{Script=Han}]+/gu)?.join("") ?? segment,
      );
      continue;
    }

    if (!draft.pinyinCanonical && looksLikeExplicitPinyinSegment(segment)) {
      draft.pinyinCanonical = normalizeStoredPinyin(segment);
      continue;
    }
  }

  if (!draft.pinyinCanonical) {
    const inlineParse = extractInlinePinyinAndTranslation(cleanedSourceText);
    const pinyinCandidate =
      inlineParse.pinyinCandidate || extractBarePinyinCandidate(cleanedSourceText);

    if (pinyinCandidate) {
      draft.pinyinCanonical = normalizeStoredPinyin(pinyinCandidate);
    }

    if (!draft.translation && inlineParse.translationCandidate) {
      draft.translation = normalizeStoredTranslation(inlineParse.translationCandidate);
    }
  }

  const translationCandidate = !draft.translation
    ? extractTranslationCandidate(cleanedSourceText, draft)
    : "";

  if (translationCandidate) {
    draft.translation = normalizeStoredTranslation(translationCandidate);
  }

  return draft;
}

export function normalizeWordDraft(draft: Partial<WordDraft>): WordDraft {
  return {
    pinyinCanonical: normalizeStoredPinyin(draft.pinyinCanonical ?? ""),
    simplified: normalizeStoredChinese(draft.simplified ?? ""),
    translation: normalizeStoredTranslation(draft.translation ?? ""),
  };
}

export function mergeWordDrafts(
  baseDraft: WordDraft,
  enrichmentDraft: Partial<WordDraft>,
) {
  return normalizeWordDraft({
    pinyinCanonical: baseDraft.pinyinCanonical || enrichmentDraft.pinyinCanonical,
    simplified: baseDraft.simplified || enrichmentDraft.simplified,
    translation: baseDraft.translation || enrichmentDraft.translation,
  });
}

export function listMissingWordDraftFields(draft: WordDraft): WordDraftField[] {
  const missingFields: WordDraftField[] = [];

  if (!draft.simplified) {
    missingFields.push("simplified");
  }

  if (!draft.pinyinCanonical) {
    missingFields.push("pinyinCanonical");
  }

  if (!draft.translation) {
    missingFields.push("translation");
  }

  return missingFields;
}

export function normalizeStoredPinyin(value: string) {
  return normalizePinyinForStorage(value);
}

export function normalizeStoredChinese(value: string) {
  return collapseSpaces(value).replace(/\s+/g, "");
}

export function normalizeStoredTranslation(value: string) {
  return collapseSpaces(value);
}

function emptyWordDraft(): WordDraft {
  return {
    pinyinCanonical: "",
    simplified: "",
    translation: "",
  };
}

function splitSourceText(value: string) {
  return value
    .split(/[\n,;|/]+|\s+-\s+|\s+=\s+|\s+->\s+/)
    .map((segment) => collapseSpaces(segment))
    .filter(Boolean);
}

function extractBarePinyinCandidate(sourceText: string) {
  const withoutHanzi = sourceText.replace(/[\p{Script=Han}]+/gu, " ");
  const tokens = withoutHanzi
    .split(/\s+/)
    .map((token) => stripOuterPunctuation(token))
    .filter(Boolean);

  if (tokens.length < 1) {
    return "";
  }

  if (tokens.length === 1 && !hasPinyinToneInformation(tokens[0] ?? "")) {
    return "";
  }

  if (tokens.some((token) => !looksLikeBarePinyinToken(token))) {
    return "";
  }

  return tokens.join(" ");
}

function extractInlinePinyinAndTranslation(sourceText: string) {
  const withoutHanzi = sourceText.replace(/[\p{Script=Han}]+/gu, " ");
  const tokens = withoutHanzi
    .split(/\s+/)
    .map((token) => stripOuterPunctuation(token))
    .filter(Boolean);
  const pinyinTokens: string[] = [];
  const translationTokens: string[] = [];

  for (const token of tokens) {
    if (
      translationTokens.length === 0 &&
      looksLikePinyinTokenInSequence(token, pinyinTokens.length > 0, tokens.length)
    ) {
      pinyinTokens.push(token);
      continue;
    }

    translationTokens.push(token);
  }

  return {
    pinyinCandidate: pinyinTokens.join(" "),
    translationCandidate: translationTokens.join(" "),
  };
}

function extractTranslationCandidate(sourceText: string, draft: WordDraft) {
  let remainingText = sourceText;

  if (draft.simplified) {
    remainingText = remainingText.replace(draft.simplified, " ");
  }

  if (draft.pinyinCanonical) {
    const pinyinForms = [
      draft.pinyinCanonical,
      draft.pinyinCanonical.replace(/\s+/g, ""),
    ];

    for (const pinyinForm of pinyinForms) {
      if (pinyinForm) {
        const escaped = escapeRegExp(pinyinForm);
        remainingText = remainingText.replace(new RegExp(escaped, "ig"), " ");
      }
    }
  }

  remainingText = remainingText
    .replace(/[1-5]/g, " ")
    .replace(/[\u0101\u00e1\u01ce\u00e0\u0113\u00e9\u011b\u00e8\u012b\u00ed\u01d0\u00ec\u014d\u00f3\u01d2\u00f2\u016b\u00fa\u01d4\u00f9\u01d6\u01d8\u01da\u01dc]/g, " ")
    .replace(/[\p{Script=Han}]+/gu, " ")
    .replace(/[-_/|,;]+/g, " ");

  const normalizedTranslation = collapseSpaces(remainingText);

  return looksLikeTranslation(normalizedTranslation) ? normalizedTranslation : "";
}

function containsHanzi(value: string) {
  return /[\p{Script=Han}]/u.test(value);
}

function looksLikeExplicitPinyinSegment(value: string) {
  const normalizedValue = stripOuterPunctuation(value);

  return (
    hasPinyinToneInformation(normalizedValue) &&
    /^[a-zA-Z\u0101\u00e1\u01ce\u00e0\u0113\u00e9\u011b\u00e8\u012b\u00ed\u01d0\u00ec\u014d\u00f3\u01d2\u00f2\u016b\u00fa\u01d4\u00f9\u00fc\u01d6\u01d8\u01da\u01dc0-5\s'-]+$/.test(
      normalizedValue,
    )
  );
}

function looksLikePinyinTokenInSequence(
  token: string,
  hasStartedPinyinSequence: boolean,
  totalTokenCount: number,
) {
  if (looksLikeExplicitPinyinSegment(token)) {
    return true;
  }

  if (!hasStartedPinyinSequence && totalTokenCount === 1) {
    return false;
  }

  return looksLikeBarePinyinToken(token);
}

function looksLikeBarePinyinToken(value: string) {
  const normalizedValue = stripOuterPunctuation(value).toLowerCase();

  if (!normalizedValue || commonEnglishWords.has(normalizedValue)) {
    return false;
  }

  return (
    /^[a-z\u00fc]+$/.test(normalizedValue) &&
    normalizedValue.length <= 6 &&
    /[aeiouvy\u00fc]/.test(normalizedValue)
  );
}

function looksLikeTranslation(value: string) {
  return /[a-zA-Z]/.test(value);
}

function collapseSpaces(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function stripOuterPunctuation(value: string) {
  return value.replace(/^[\s"'`([{]+|[\s"'`)\]}.,!?]+$/g, "");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const commonEnglishWords = new Set([
  "a",
  "an",
  "and",
  "hello",
  "i",
  "is",
  "my",
  "study",
  "the",
  "to",
  "word",
  "you",
]);
