import { randomUUID } from "node:crypto";

export interface StoredWordReviewSchedule {
  createdAt: string;
  failureCount: number;
  id: string;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  reviewCount: number;
  successCount: number;
  updatedAt: string;
  userId: string;
  wordId: string;
}

const successIntervalsInMinutes = [10, 8 * 60, 24 * 60, 3 * 24 * 60, 7 * 24 * 60];
const failureIntervalInMinutes = 10;

export function createInitialWordReviewSchedule(
  userId: string,
  wordId: string,
  createdAt = new Date().toISOString(),
): StoredWordReviewSchedule {
  return {
    createdAt,
    failureCount: 0,
    id: randomUUID(),
    lastReviewedAt: null,
    nextReviewAt: createdAt,
    reviewCount: 0,
    successCount: 0,
    updatedAt: createdAt,
    userId,
    wordId,
  };
}

export function isWordReviewDue(
  schedule: StoredWordReviewSchedule,
  referenceTime = new Date(),
) {
  return schedule.nextReviewAt <= referenceTime.toISOString();
}

export function getNextScheduledReviewAt(
  schedules: StoredWordReviewSchedule[],
  referenceTime = new Date(),
) {
  const referenceIso = referenceTime.toISOString();
  const upcomingSchedules = schedules
    .filter((schedule) => schedule.nextReviewAt > referenceIso)
    .sort((left, right) => left.nextReviewAt.localeCompare(right.nextReviewAt));

  return upcomingSchedules[0]?.nextReviewAt ?? null;
}

export function updateWordReviewSchedule(
  schedule: StoredWordReviewSchedule,
  isCorrect: boolean,
  reviewedAt: Date | string = new Date(),
): StoredWordReviewSchedule {
  const reviewedAtDate =
    typeof reviewedAt === "string" ? new Date(reviewedAt) : reviewedAt;
  const reviewedAtIso = reviewedAtDate.toISOString();
  const nextReviewAt = isCorrect
    ? addMinutes(reviewedAtDate, pickSuccessInterval(schedule.successCount))
    : addMinutes(reviewedAtDate, failureIntervalInMinutes);

  return {
    ...schedule,
    failureCount: schedule.failureCount + (isCorrect ? 0 : 1),
    lastReviewedAt: reviewedAtIso,
    nextReviewAt,
    reviewCount: schedule.reviewCount + 1,
    successCount: schedule.successCount + (isCorrect ? 1 : 0),
    updatedAt: reviewedAtIso,
  };
}

function pickSuccessInterval(successCount: number) {
  return (
    successIntervalsInMinutes[Math.min(successCount, successIntervalsInMinutes.length - 1)] ??
    successIntervalsInMinutes[successIntervalsInMinutes.length - 1] ??
    10
  );
}

function addMinutes(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60_000).toISOString();
}
