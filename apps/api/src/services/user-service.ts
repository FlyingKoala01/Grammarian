import type {
  AppLocale,
  GetUserResponse,
  UpdateUserPreferencesResponse,
} from "@grammarian/shared";

import { AppError } from "../errors/app-error.js";
import { buildStudyProgressSummary } from "../domain/word-exercise.js";
import { devStoreRepository } from "../repositories/dev-store-repository.js";

class UserService {
  async getUser(userId: string): Promise<GetUserResponse> {
    const user = await devStoreRepository.findUserById(userId);

    if (!user) {
      throw new AppError(404, "User not found.");
    }

    const [attempts, reviewSchedules, words] = await Promise.all([
      devStoreRepository.listExerciseAttemptsByUserId(userId),
      devStoreRepository.listReviewSchedulesByUserId(userId),
      devStoreRepository.listWordsByUserId(userId),
    ]);

    return {
      progress: buildStudyProgressSummary(words, attempts, reviewSchedules),
      user,
    };
  }

  async updateUserPreferences(
    userId: string,
    preferredLanguage: AppLocale,
  ): Promise<UpdateUserPreferencesResponse> {
    const user = await devStoreRepository.updateUserPreferredLanguage(
      userId,
      preferredLanguage,
    );

    if (!user) {
      throw new AppError(404, "User not found.");
    }

    const [attempts, reviewSchedules, words] = await Promise.all([
      devStoreRepository.listExerciseAttemptsByUserId(userId),
      devStoreRepository.listReviewSchedulesByUserId(userId),
      devStoreRepository.listWordsByUserId(userId),
    ]);

    return {
      progress: buildStudyProgressSummary(words, attempts, reviewSchedules),
      user,
    };
  }
}

export const userService = new UserService();
