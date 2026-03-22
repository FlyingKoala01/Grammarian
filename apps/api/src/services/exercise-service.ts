import type {
  DocumentedExerciseType,
  GetNextWordExerciseResponse,
  SubmitWordExerciseRequest,
  SubmitWordExerciseResponse,
} from "@grammarian/shared";

import {
  buildNextWordExercise,
  buildStudyProgressSummary,
  createExerciseFeedback,
  evaluateWordExercise,
  parseExerciseId,
} from "../domain/word-exercise.js";
import { updateWordReviewSchedule } from "../domain/word-review.js";
import { AppError } from "../errors/app-error.js";
import { devStoreRepository } from "../repositories/dev-store-repository.js";

class ExerciseService {
  async getNextWordExercise(
    userId: string,
    exerciseType?: DocumentedExerciseType,
  ): Promise<GetNextWordExerciseResponse> {
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
      availableWordCount: words.length,
      exercise: buildNextWordExercise(
        words,
        attempts,
        reviewSchedules,
        user.preferredLanguage,
        exerciseType,
      ),
      progress: buildStudyProgressSummary(words, attempts, reviewSchedules),
    };
  }

  async submitWordExercise(
    userId: string,
    input: SubmitWordExerciseRequest,
  ): Promise<SubmitWordExerciseResponse> {
    const user = await devStoreRepository.findUserById(userId);

    if (!user) {
      throw new AppError(404, "User not found.");
    }

    const { wordId } = parseExerciseId(input.exerciseId);
    const word = await devStoreRepository.findWordById(wordId);

    if (!word || word.userId !== userId) {
      throw new AppError(404, "Word not found for this user.");
    }

    const evaluation = evaluateWordExercise(input.exerciseId, input.answer, word);

    await devStoreRepository.recordExerciseAttempt({
      answer: input.answer.trim(),
      exerciseId: input.exerciseId,
      isCorrect: evaluation.isCorrect,
      kind: evaluation.kind,
      normalizedAnswer: evaluation.normalizedAnswer,
      userId,
      wordId,
    });
    await devStoreRepository.updateReviewScheduleForWord(userId, wordId, (schedule) =>
      updateWordReviewSchedule(schedule, evaluation.isCorrect),
    );

    const [attempts, reviewSchedules, words] = await Promise.all([
      devStoreRepository.listExerciseAttemptsByUserId(userId),
      devStoreRepository.listReviewSchedulesByUserId(userId),
      devStoreRepository.listWordsByUserId(userId),
    ]);

    return {
      progress: buildStudyProgressSummary(words, attempts, reviewSchedules),
      result: {
        ...createExerciseFeedback(evaluation, user.preferredLanguage),
        ...evaluation,
      },
    };
  }
}

export const exerciseService = new ExerciseService();
