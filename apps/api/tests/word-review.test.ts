import { describe, expect, it } from "vitest";

import {
  createInitialWordReviewSchedule,
  updateWordReviewSchedule,
} from "../src/domain/word-review.js";

describe("word review scheduling", () => {
  it("schedules the first successful review 10 minutes later", () => {
    const initialSchedule = createInitialWordReviewSchedule(
      "user-1",
      "word-1",
      "2026-03-22T10:00:00.000Z",
    );

    const nextSchedule = updateWordReviewSchedule(
      initialSchedule,
      true,
      "2026-03-22T10:00:00.000Z",
    );

    expect(nextSchedule.successCount).toBe(1);
    expect(nextSchedule.failureCount).toBe(0);
    expect(nextSchedule.reviewCount).toBe(1);
    expect(nextSchedule.nextReviewAt).toBe("2026-03-22T10:10:00.000Z");
  });

  it("resets a failed review to the short retry interval", () => {
    const reviewedSchedule = {
      ...createInitialWordReviewSchedule(
        "user-1",
        "word-1",
        "2026-03-22T10:00:00.000Z",
      ),
      reviewCount: 2,
      successCount: 2,
    };

    const nextSchedule = updateWordReviewSchedule(
      reviewedSchedule,
      false,
      "2026-03-22T12:00:00.000Z",
    );

    expect(nextSchedule.successCount).toBe(2);
    expect(nextSchedule.failureCount).toBe(1);
    expect(nextSchedule.reviewCount).toBe(3);
    expect(nextSchedule.nextReviewAt).toBe("2026-03-22T12:10:00.000Z");
  });
});
