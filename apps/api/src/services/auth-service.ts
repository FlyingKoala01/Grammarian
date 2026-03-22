import type { AppLocale, DemoLoginResponse } from "@grammarian/shared";

import { buildStudyProgressSummary } from "../domain/word-exercise.js";
import { devStoreRepository } from "../repositories/dev-store-repository.js";

class AuthService {
  async demoLogin(
    displayName: string,
    preferredLanguage: AppLocale,
  ): Promise<DemoLoginResponse> {
    const trimmedDisplayName = displayName.trim();

    const existingUser =
      await devStoreRepository.findUserByDisplayName(trimmedDisplayName);

    const user = existingUser
      ? existingUser.preferredLanguage === preferredLanguage
        ? existingUser
        : await devStoreRepository.updateUserPreferredLanguage(
            existingUser.id,
            preferredLanguage,
          )
      : await devStoreRepository.createUser(trimmedDisplayName, preferredLanguage);

    if (!user) {
      throw new Error("The learner could not be loaded after login.");
    }

    const [attempts, reviewSchedules, words] = await Promise.all([
      devStoreRepository.listExerciseAttemptsByUserId(user.id),
      devStoreRepository.listReviewSchedulesByUserId(user.id),
      devStoreRepository.listWordsByUserId(user.id),
    ]);

    return {
      progress: buildStudyProgressSummary(words, attempts, reviewSchedules),
      user,
    };
  }
}

export const authService = new AuthService();
