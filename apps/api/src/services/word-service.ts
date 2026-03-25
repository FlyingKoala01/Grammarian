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
import { AppError } from "../errors/app-error.js";
import { studyRepository } from "../repositories/index.js";
import { wordIntakeService } from "./word-intake-service.js";

class WordService {
  async createWord(
    userId: string,
    input: CreateWordRequest,
  ): Promise<CreateWordResponse> {
    const user = await this.requireUser(userId);
    const { draft: validatedWord, validation } =
      await this.validateWordForSave(input, user.preferredLanguage);

    const existingWord = await studyRepository.findWordByUserAndSimplified(
      userId,
      validatedWord.simplified,
    );

    if (existingWord) {
      throw new AppError(409, "That word already exists for this user.");
    }

    const word = await studyRepository.createWord({
      ...validatedWord,
      translationLanguage: user.preferredLanguage,
      userId,
    });

    return { validation, word };
  }

  async updateWord(
    userId: string,
    wordId: string,
    input: UpdateWordRequest,
  ): Promise<UpdateWordResponse> {
    const user = await this.requireUser(userId);

    const existingWord = await studyRepository.findWordById(wordId);

    if (!existingWord || existingWord.userId !== userId) {
      throw new AppError(404, "Word not found.");
    }

    const { draft: validatedWord, validation } =
      await this.validateWordForSave(input, user.preferredLanguage);
    const conflictingWord = await studyRepository.findWordByUserAndSimplified(
      userId,
      validatedWord.simplified,
    );

    if (conflictingWord && conflictingWord.id !== wordId) {
      throw new AppError(409, "That word already exists for this user.");
    }

    const word = await studyRepository.updateWord(userId, wordId, {
      ...validatedWord,
      translationLanguage: user.preferredLanguage,
    });

    if (!word) {
      throw new AppError(404, "Word not found.");
    }

    return { validation, word };
  }

  async listWords(userId: string): Promise<ListWordsResponse> {
    await this.requireUser(userId);

    return {
      words: await studyRepository.listWordsByUserId(userId),
    };
  }

  private async requireUser(userId: string) {
    const user = await studyRepository.findUserById(userId);

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
}

export const wordService = new WordService();
