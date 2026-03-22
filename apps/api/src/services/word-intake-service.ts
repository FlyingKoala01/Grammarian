import type {
  NormalizeWordResponse,
  SuggestWordDraftResponse,
  SuggestWordDraftRequest,
  AppLocale,
  WordDraft,
  WordFieldSuggestions,
  WordValidationResult,
} from "@grammarian/shared";

import {
  buildDeterministicWordDraft,
  listMissingWordDraftFields,
  mergeWordDrafts,
  normalizeStoredChinese,
  normalizeStoredPinyin,
  normalizeStoredTranslation,
  normalizeWordDraft,
} from "../domain/word-intake.js";
import { AppError } from "../errors/app-error.js";
import { openAIWordIntakeNormalizer } from "../llm/openai-word-intake-normalizer.js";
import { devStoreRepository } from "../repositories/dev-store-repository.js";

class WordIntakeService {
  async normalizeWord(
    userId: string,
    sourceText: string,
  ): Promise<NormalizeWordResponse> {
    const user = await devStoreRepository.findUserById(userId);

    if (!user) {
      throw new AppError(404, "User not found.");
    }

    const deterministicDraft = normalizeWordDraft(
      buildDeterministicWordDraft(sourceText),
    );
    const notes: string[] = [];
    let mode: NormalizeWordResponse["mode"] = "deterministic";
    let model: string | null = null;
    let finalDraft = deterministicDraft;

    try {
      const llmResponse = await openAIWordIntakeNormalizer.normalizeWordDraft(
        sourceText,
        deterministicDraft,
        user.preferredLanguage,
      );

      if (llmResponse) {
        finalDraft = mergeWordDrafts(
          deterministicDraft,
          normalizeWordDraft(llmResponse.draft),
        );
        mode = hasMissingFields(deterministicDraft) ? "hybrid" : "llm_assisted";
        model = llmResponse.model;
        notes.push(...llmResponse.notes);
      }
    } catch {
      notes.push("AI assist was unavailable, so the draft uses deterministic parsing only.");
    }

    const missingFields = listMissingWordDraftFields(finalDraft);

    if (model === null) {
      notes.push(
        missingFields.length === 0
          ? "The draft was prepared without AI assistance."
          : "Review the remaining blank fields before saving.",
      );
    } else if (missingFields.length > 0) {
      notes.push("Review the AI suggestion carefully before saving.");
    }

    return {
      draft: finalDraft,
      missingFields,
      mode,
      model,
      notes: Array.from(new Set(notes)).filter(Boolean),
    };
  }

  async suggestWordDraft(
    userId: string,
    draftInput: Partial<WordDraft>,
    requestMode: SuggestWordDraftRequest["mode"] = "hybrid",
  ): Promise<SuggestWordDraftResponse> {
    const user = await devStoreRepository.findUserById(userId);

    if (!user) {
      throw new AppError(404, "User not found.");
    }

    const normalizedInput = normalizeWordDraft(draftInput);
    const notes: string[] = [];
    let mode: SuggestWordDraftResponse["mode"] = "deterministic";
    let model: string | null = null;
    let draft = normalizedInput;
    let suggestions = buildDeterministicSuggestions(draftInput, normalizedInput);

    if (requestMode === "hybrid") {
      try {
        const llmResponse = await openAIWordIntakeNormalizer.suggestWordDraft(
          normalizedInput,
          user.preferredLanguage,
        );

        if (llmResponse) {
          const llmDraft = normalizeWordDraft(llmResponse.draft);

          draft = mergeWordDrafts(normalizedInput, llmDraft);
          suggestions = mergeWordSuggestions(suggestions, llmResponse.suggestions);
          mode = hasMissingFields(normalizedInput) ? "hybrid" : "llm_assisted";
          model = llmResponse.model;
          notes.push(...llmResponse.notes);
        }
      } catch {
        notes.push("AI suggestions were unavailable.");
      }
    }

    suggestions = prependCompletedDraftSuggestions(suggestions, normalizedInput, draft);

    if (requestMode === "deterministic" && hasMissingFields(normalizedInput)) {
      notes.push("Fast suggestions loaded. Pause briefly for AI refinement.");
    } else if (model === null && hasMissingFields(normalizedInput)) {
      notes.push("Add another field for stronger suggestions.");
    }

    return {
      draft,
      missingFields: listMissingWordDraftFields(draft),
      mode,
      model,
      notes: Array.from(new Set(notes)).filter(Boolean),
      suggestions,
    };
  }

  async validateSavedWordDraft(
    draftInput: WordDraft,
    preferredLanguage: AppLocale,
  ): Promise<{
    draft: WordDraft;
    validation: WordValidationResult;
  }> {
    const normalizedDraft = normalizeWordDraft(draftInput);

    try {
      const llmResponse = await openAIWordIntakeNormalizer.validateWordDraft(
        normalizedDraft,
        preferredLanguage,
      );

      if (!llmResponse) {
        return {
          draft: normalizedDraft,
          validation: {
            correctedFields: [],
            model: null,
            notes: ["Saved without AI verification."],
            status: "unverified",
          },
        };
      }

      const correctedDraft = normalizeWordDraft(llmResponse.correctedDraft);

      return {
        draft: correctedDraft,
        validation: {
          correctedFields: llmResponse.correctedFields.filter((field) =>
            normalizedDraft[field] !== correctedDraft[field],
          ),
          model: llmResponse.model,
          notes: Array.from(new Set(llmResponse.notes)).filter(Boolean),
          status:
            llmResponse.status === "corrected" &&
            normalizedDraft.pinyinCanonical === correctedDraft.pinyinCanonical &&
            normalizedDraft.simplified === correctedDraft.simplified &&
            normalizedDraft.translation === correctedDraft.translation
              ? "verified"
              : llmResponse.status,
        },
      };
    } catch {
      return {
        draft: normalizedDraft,
        validation: {
          correctedFields: [],
          model: null,
          notes: ["AI verification was unavailable while saving."],
          status: "unverified",
        },
      };
    }
  }
}

function hasMissingFields(draft: WordDraft) {
  return !draft.simplified || !draft.pinyinCanonical || !draft.translation;
}

function emptyWordSuggestions(): WordFieldSuggestions {
  return {
    pinyinCanonical: [],
    simplified: [],
    translation: [],
  };
}

function buildDeterministicSuggestions(
  rawDraft: Partial<WordDraft>,
  normalizedDraft: WordDraft,
) {
  const suggestions = emptyWordSuggestions();
  const rawSimplified = collapseSpaces(rawDraft.simplified ?? "").replace(/\s+/g, "");
  const rawPinyin = collapseSpaces(rawDraft.pinyinCanonical ?? "");
  const rawTranslation = collapseSpaces(rawDraft.translation ?? "");

  if (normalizedDraft.simplified && normalizedDraft.simplified !== rawSimplified) {
    suggestions.simplified.push(normalizedDraft.simplified);
  }

  if (normalizedDraft.pinyinCanonical && normalizedDraft.pinyinCanonical !== rawPinyin) {
    suggestions.pinyinCanonical.push(normalizedDraft.pinyinCanonical);
  }

  if (normalizedDraft.translation && normalizedDraft.translation !== rawTranslation) {
    suggestions.translation.push(normalizedDraft.translation);
  }

  return suggestions;
}

function mergeWordSuggestions(
  baseSuggestions: WordFieldSuggestions,
  enrichmentSuggestions: WordFieldSuggestions,
) {
  return {
    pinyinCanonical: dedupeSuggestions(
      "pinyinCanonical",
      ...baseSuggestions.pinyinCanonical,
      ...enrichmentSuggestions.pinyinCanonical,
    ),
    simplified: dedupeSuggestions(
      "simplified",
      ...baseSuggestions.simplified,
      ...enrichmentSuggestions.simplified,
    ),
    translation: dedupeSuggestions(
      "translation",
      ...baseSuggestions.translation,
      ...enrichmentSuggestions.translation,
    ),
  };
}

function prependCompletedDraftSuggestions(
  suggestions: WordFieldSuggestions,
  inputDraft: WordDraft,
  completedDraft: WordDraft,
) {
  return {
    pinyinCanonical:
      completedDraft.pinyinCanonical &&
      completedDraft.pinyinCanonical !== inputDraft.pinyinCanonical
        ? dedupeSuggestions(
            "pinyinCanonical",
            completedDraft.pinyinCanonical,
            ...suggestions.pinyinCanonical,
          )
        : suggestions.pinyinCanonical,
    simplified:
      completedDraft.simplified && completedDraft.simplified !== inputDraft.simplified
        ? dedupeSuggestions(
            "simplified",
            completedDraft.simplified,
            ...suggestions.simplified,
          )
        : suggestions.simplified,
    translation:
      completedDraft.translation && completedDraft.translation !== inputDraft.translation
        ? dedupeSuggestions(
            "translation",
            completedDraft.translation,
            ...suggestions.translation,
          )
        : suggestions.translation,
  };
}

function dedupeSuggestions(
  field: keyof WordFieldSuggestions,
  ...values: string[]
) {
  const normalize =
    field === "simplified"
      ? normalizeStoredChinese
      : field === "pinyinCanonical"
        ? normalizeStoredPinyin
        : normalizeStoredTranslation;

  return Array.from(
    new Set(
      values
        .map((value) => normalize(value))
        .filter(Boolean),
    ),
  ).slice(0, 3);
}

function collapseSpaces(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export const wordIntakeService = new WordIntakeService();
