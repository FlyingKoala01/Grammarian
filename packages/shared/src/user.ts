import type { AppLocale } from "./locale.js";

export interface LearnerProfile {
  id: string;
  displayName: string;
  createdAt: string;
  preferredLanguage: AppLocale;
}

export interface StudyProgressSummary {
  dueReviewCount: number;
  nextReviewAt: string | null;
  totalWords: number;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
}

export interface DemoLoginRequest {
  displayName: string;
  preferredLanguage: AppLocale;
}

export interface DemoLoginResponse {
  user: LearnerProfile;
  progress: StudyProgressSummary;
}

export interface GetUserResponse {
  user: LearnerProfile;
  progress: StudyProgressSummary;
}

export interface UpdateUserPreferencesRequest {
  preferredLanguage: AppLocale;
}

export interface UpdateUserPreferencesResponse {
  user: LearnerProfile;
  progress: StudyProgressSummary;
}
