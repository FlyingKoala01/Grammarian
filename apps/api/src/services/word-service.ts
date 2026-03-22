import type {
  CreateWordRequest,
  CreateWordResponse,
  ListWordsResponse,
  StudyWord,
  UpdateWordRequest,
  UpdateWordResponse,
  WordDraft,
  WordValidationResult,
} from "@grammarian/shared";

import {
  normalizeStoredChinese,
  normalizeStoredPinyin,
  normalizeStoredTranslation,
} from "../domain/word-intake.js";
import { buildListedStudyWords } from "../domain/word-review.js";
import { AppError } from "../errors/app-error.js";
import { devStoreRepository } from "../repositories/dev-store-repository.js";
import { wordIntakeService } from "./word-intake-service.js";

class WordService {
  async createWord(
    userId: string,
    input: CreateWordRequest,
  ): Promise<CreateWordResponse> {
    const user = await this.requireUser(userId);
    const { draft: validatedWord, validation } =
      await this.validateWordForSave(input, user.preferredLanguage);

    const existingWord = await devStoreRepository.findWordByUserAndSimplified(
      userId,
      validatedWord.simplified,
    );

    if (existingWord) {
      throw new AppError(409, "That word already exists for this user.");
    }

    const word = await devStoreRepository.createWord({
      ...validatedWord,
      translationLanguage: user.preferredLanguage,
      userId,
    });
    const listedWord = await this.buildListedWord(userId, word);

    if (!listedWord) {
      throw new AppError(500, "The saved word could not be loaded.");
    }

    return { validation, word: listedWord };
  }

  async updateWord(
    userId: string,
    wordId: string,
    input: UpdateWordRequest,
  ): Promise<UpdateWordResponse> {
    const user = await this.requireUser(userId);

    const existingWord = await devStoreRepository.findWordById(wordId);

    if (!existingWord || existingWord.userId !== userId) {
      throw new AppError(404, "Word not found.");
    }

    const { draft: validatedWord, validation } =
      await this.validateWordForSave(input, user.preferredLanguage);
    const conflictingWord = await devStoreRepository.findWordByUserAndSimplified(
      userId,
      validatedWord.simplified,
    );

    if (conflictingWord && conflictingWord.id !== wordId) {
      throw new AppError(409, "That word already exists for this user.");
    }

    const word = await devStoreRepository.updateWord(userId, wordId, {
      ...validatedWord,
      translationLanguage: user.preferredLanguage,
    });

    if (!word) {
      throw new AppError(404, "Word not found.");
    }

    const listedWord = await this.buildListedWord(userId, word);

    if (!listedWord) {
      throw new AppError(500, "The updated word could not be loaded.");
    }

    return { validation, word: listedWord };
  }

  async listWords(userId: string): Promise<ListWordsResponse> {
    await this.requireUser(userId);

    const [reviewSchedules, words] = await Promise.all([
      devStoreRepository.listReviewSchedulesByUserId(userId),
      devStoreRepository.listWordsByUserId(userId),
    ]);

    return {
      words: buildListedStudyWords(words, reviewSchedules),
    };
  }

  private async requireUser(userId: string) {
    const user = await devStoreRepository.findUserById(userId);

    if (!user) {
      throw new AppError(404, "User not found.");
    }

    return user;
  }

  private async validateWordForSave(
    input: WordDraft,
    preferredLanguage: StudyWord["translationLanguage"],
  ): Promise<{
    draft: WordDraft;
    validation: WordValidationResult;
  }> {
    const normalizedWord = {
      pinyinCanonical: normalizeStoredPinyin(input.pinyinCanonical),
      simplified: normalizeStoredChinese(input.simplified),
      translation: normalizeStoredTranslation(input.translation),
    };

    return wordIntakeService.validateSavedWordDraft(
      normalizedWord,
      preferredLanguage,
    );
  }

  private async buildListedWord(userId: string, word: StudyWord) {
    const reviewSchedules = await devStoreRepository.listReviewSchedulesByUserId(userId);
    return buildListedStudyWords([word], reviewSchedules)[0];
  }
}

export const wordService = new WordService();
