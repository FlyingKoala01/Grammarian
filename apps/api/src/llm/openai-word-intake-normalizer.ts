import OpenAI from "openai";
import { z } from "zod";

import type {
  AppLocale,
  WordDraft,
  WordDraftField,
  WordFieldSuggestions,
  WordValidationStatus,
} from "@grammarian/shared";
import { getAppLocaleEnglishName } from "@grammarian/shared";

import { env } from "../lib/env.js";

const llmDraftSchema = z.object({
  pinyinCanonical: z.string(),
  simplified: z.string(),
  translation: z.string(),
});

const llmSuggestionListsSchema = z.object({
  pinyinCanonical: z.array(z.string()).max(3),
  simplified: z.array(z.string()).max(3),
  translation: z.array(z.string()).max(3),
});

const llmWordNormalizationSchema = llmDraftSchema.extend({
  notes: z.array(z.string()).max(5),
});

const llmWordSuggestionSchema = z.object({
  draft: llmDraftSchema,
  notes: z.array(z.string()).max(5),
  suggestions: llmSuggestionListsSchema,
});

const llmWordValidationSchema = z.object({
  correctedDraft: llmDraftSchema,
  correctedFields: z.array(z.enum(["simplified", "pinyinCanonical", "translation"])).max(3),
  notes: z.array(z.string()).max(5),
  status: z.enum(["verified", "corrected", "unverified"]),
});

class OpenAIWordIntakeNormalizer {
  private client = env.LLM_API_KEY ? new OpenAI({ apiKey: env.LLM_API_KEY }) : null;

  async normalizeWordDraft(
    sourceText: string,
    deterministicDraft: WordDraft,
    preferredLanguage: AppLocale,
  ): Promise<{
    draft: WordDraft;
    model: string;
    notes: string[];
  } | null> {
    if (!this.client) {
      return null;
    }

    const translationLanguage = getAppLocaleEnglishName(preferredLanguage);

    const response = await this.client.responses.create({
      input: [
        "Normalize one Chinese study word or short expression.",
        "Only fill fields you are reasonably confident about.",
        "If a field is unknown or ambiguous, return an empty string for it.",
        "If the source already includes hanzi, keep that word exact unless you are only converting traditional to simplified Chinese.",
        "Use simplified Chinese for hanzi.",
        "Use readable pinyin with tone marks and spaces between syllables when there are multiple syllables.",
        `Use a short ${translationLanguage} translation.`,
        "",
        `Source text: ${sourceText}`,
        `Deterministic draft: ${JSON.stringify(deterministicDraft)}`,
      ].join("\n"),
      instructions:
        "You extract structured vocabulary data for a Chinese study app. Do not invent uncertain fields. Always return valid JSON that matches the schema exactly.",
      model: env.LLM_MODEL,
      store: false,
      text: {
        format: {
          name: "word_intake_normalization",
          schema: {
            additionalProperties: false,
            properties: {
              notes: {
                items: { type: "string" },
                maxItems: 5,
                type: "array",
              },
              pinyinCanonical: { type: "string" },
              simplified: { type: "string" },
              translation: { type: "string" },
            },
            required: ["simplified", "pinyinCanonical", "translation", "notes"],
            type: "object",
          },
          strict: true,
          type: "json_schema",
        },
      },
    });

    const outputText = response.output_text?.trim();

    if (!outputText) {
      return null;
    }

    const parsedResponse = llmWordNormalizationSchema.parse(JSON.parse(outputText));

    return {
      draft: {
        pinyinCanonical: parsedResponse.pinyinCanonical,
        simplified: parsedResponse.simplified,
        translation: parsedResponse.translation,
      },
      model: env.LLM_MODEL,
      notes: parsedResponse.notes,
    };
  }

  async suggestWordDraft(
    partialDraft: WordDraft,
    preferredLanguage: AppLocale,
  ): Promise<{
    draft: WordDraft;
    model: string;
    notes: string[];
    suggestions: WordFieldSuggestions;
  } | null> {
    if (!this.client) {
      return null;
    }

    const translationLanguage = getAppLocaleEnglishName(preferredLanguage);

    const response = await this.client.responses.create({
      input: [
        "Suggest completions for one Chinese study word or short expression.",
        "Keep any non-empty user field unless it is only formatting that can be normalized.",
        "Treat any non-empty hanzi field as authoritative. Never replace it with a different word.",
        "Only suggest fields you are reasonably confident about.",
        "Use simplified Chinese for hanzi.",
        "Use readable pinyin with tone marks and spaces between syllables when there are multiple syllables.",
        `Use short ${translationLanguage} translations.`,
        "Provide up to 3 suggestions per field ranked best first.",
        "If the input already identifies one concrete word, keep suggestions aligned to that exact word.",
        "Do not switch to related words, individual characters, or broader phrases unless the input is clearly ambiguous.",
        "If a field is uncertain, leave the draft field empty and return an empty suggestion list for it.",
        "",
        `Partial draft: ${JSON.stringify(partialDraft)}`,
      ].join("\n"),
      instructions:
        "You generate cautious autocomplete suggestions for a Chinese study app. Do not invent uncertain vocabulary. Always return valid JSON that matches the schema exactly.",
      model: env.LLM_MODEL,
      store: false,
      text: {
        format: {
          name: "word_intake_suggestion",
          schema: {
            additionalProperties: false,
            properties: {
              draft: {
                additionalProperties: false,
                properties: {
                  pinyinCanonical: { type: "string" },
                  simplified: { type: "string" },
                  translation: { type: "string" },
                },
                required: ["simplified", "pinyinCanonical", "translation"],
                type: "object",
              },
              notes: {
                items: { type: "string" },
                maxItems: 5,
                type: "array",
              },
              suggestions: {
                additionalProperties: false,
                properties: {
                  pinyinCanonical: {
                    items: { type: "string" },
                    maxItems: 3,
                    type: "array",
                  },
                  simplified: {
                    items: { type: "string" },
                    maxItems: 3,
                    type: "array",
                  },
                  translation: {
                    items: { type: "string" },
                    maxItems: 3,
                    type: "array",
                  },
                },
                required: ["simplified", "pinyinCanonical", "translation"],
                type: "object",
              },
            },
            required: ["draft", "suggestions", "notes"],
            type: "object",
          },
          strict: true,
          type: "json_schema",
        },
      },
    });

    const outputText = response.output_text?.trim();

    if (!outputText) {
      return null;
    }

    const parsedResponse = llmWordSuggestionSchema.parse(JSON.parse(outputText));

    return {
      draft: parsedResponse.draft,
      model: env.LLM_MODEL,
      notes: parsedResponse.notes,
      suggestions: parsedResponse.suggestions,
    };
  }

  async validateWordDraft(
    draft: WordDraft,
    preferredLanguage: AppLocale,
  ): Promise<{
    correctedDraft: WordDraft;
    correctedFields: WordDraftField[];
    model: string;
    notes: string[];
    status: WordValidationStatus;
  } | null> {
    if (!this.client) {
      return null;
    }

    const translationLanguage = getAppLocaleEnglishName(preferredLanguage);

    const response = await this.client.responses.create({
      input: [
        "Validate one Chinese study word entry.",
        `Check whether the simplified hanzi, pinyin, and ${translationLanguage} translation describe the same common Chinese word or short expression.`,
        "Be conservative. Only correct a field when you are reasonably confident.",
        "If the hanzi field is already a plausible word, keep it exact unless you are only fixing traditional versus simplified form.",
        "Use simplified Chinese for hanzi.",
        "Use readable pinyin with tone marks and spaces between syllables when there are multiple syllables.",
        `Use a short ${translationLanguage} translation.`,
        "If the entry is consistent, return status verified.",
        "If one or more fields are likely wrong but can be corrected confidently, return status corrected.",
        "If you cannot verify the entry confidently, return status unverified and keep the draft close to the input.",
        "",
        `Draft: ${JSON.stringify(draft)}`,
      ].join("\n"),
      instructions:
        "You validate vocabulary entries for a Chinese study app. Never invent uncertain vocabulary. Always return valid JSON that matches the schema exactly.",
      model: env.LLM_MODEL,
      store: false,
      text: {
        format: {
          name: "word_intake_validation",
          schema: {
            additionalProperties: false,
            properties: {
              correctedDraft: {
                additionalProperties: false,
                properties: {
                  pinyinCanonical: { type: "string" },
                  simplified: { type: "string" },
                  translation: { type: "string" },
                },
                required: ["simplified", "pinyinCanonical", "translation"],
                type: "object",
              },
              correctedFields: {
                items: {
                  enum: ["simplified", "pinyinCanonical", "translation"],
                  type: "string",
                },
                maxItems: 3,
                type: "array",
              },
              notes: {
                items: { type: "string" },
                maxItems: 5,
                type: "array",
              },
              status: {
                enum: ["verified", "corrected", "unverified"],
                type: "string",
              },
            },
            required: ["status", "correctedDraft", "correctedFields", "notes"],
            type: "object",
          },
          strict: true,
          type: "json_schema",
        },
      },
    });

    const outputText = response.output_text?.trim();

    if (!outputText) {
      return null;
    }

    const parsedResponse = llmWordValidationSchema.parse(JSON.parse(outputText));

    return {
      correctedDraft: parsedResponse.correctedDraft,
      correctedFields: parsedResponse.correctedFields,
      model: env.LLM_MODEL,
      notes: parsedResponse.notes,
      status: parsedResponse.status,
    };
  }
}

export const openAIWordIntakeNormalizer = new OpenAIWordIntakeNormalizer();
