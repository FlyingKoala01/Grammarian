import type { AppLocale, DemoLoginResponse } from "@grammarian/shared";

import { buildStudyProgressSummary } from "../domain/word-exercise.js";
import { studyRepository } from "../repositories/index.js";

class AuthService {
  async demoLogin(
    displayName: string,
    preferredLanguage: AppLocale,
  ): Promise<DemoLoginResponse> {
    const trimmedDisplayName = displayName.trim();

    const existingUser =
      await studyRepository.findUserByDisplayName(trimmedDisplayName);

    const user = existingUser
      ? existingUser.preferredLanguage === preferredLanguage
        ? existingUser
        : await studyRepository.updateUserPreferredLanguage(
            existingUser.id,
            preferredLanguage,
          )
      : await studyRepository.createUser(trimmedDisplayName, preferredLanguage);

    if (!user) {
      throw new Error("The learner could not be loaded after login.");
    }

    const [attempts, reviewSchedules, words] = await Promise.all([
      studyRepository.listExerciseAttemptsByUserId(user.id),
      studyRepository.listReviewSchedulesByUserId(user.id),
      studyRepository.listWordsByUserId(user.id),
    ]);

    return {
      progress: buildStudyProgressSummary(words, attempts, reviewSchedules),
      user,
    };
  }
}

export const authService = new AuthService();
