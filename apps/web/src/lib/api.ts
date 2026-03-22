import type {
  ApiHealthResponse,
  CreateWordRequest,
  CreateWordResponse,
  DemoLoginRequest,
  DemoLoginResponse,
  GetNextWordExerciseRequest,
  GetNextWordExerciseResponse,
  GetUserResponse,
  ListWordsResponse,
  NormalizeWordRequest,
  NormalizeWordResponse,
  SuggestWordDraftRequest,
  SuggestWordDraftResponse,
  SubmitWordExerciseRequest,
  SubmitWordExerciseResponse,
  UpdateUserPreferencesRequest,
  UpdateUserPreferencesResponse,
  UpdateWordRequest,
  UpdateWordResponse,
} from "@grammarian/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchHealthStatus(
  signal?: AbortSignal,
): Promise<ApiHealthResponse> {
  return request<ApiHealthResponse>("/api/health", {
    signal,
  });
}

export async function demoLogin(input: DemoLoginRequest) {
  return request<DemoLoginResponse>("/api/auth/demo-login", {
    body: input,
    method: "POST",
  });
}

export async function getUser(userId: string) {
  return request<GetUserResponse>(`/api/users/${userId}`);
}

export async function listWords(userId: string) {
  return request<ListWordsResponse>(`/api/users/${userId}/words`);
}

export async function updateUserPreferences(
  userId: string,
  input: UpdateUserPreferencesRequest,
) {
  return request<UpdateUserPreferencesResponse>(`/api/users/${userId}/preferences`, {
    body: input,
    method: "PUT",
  });
}

export async function createWord(
  userId: string,
  input: CreateWordRequest,
) {
  return request<CreateWordResponse>(`/api/users/${userId}/words`, {
    body: input,
    method: "POST",
  });
}

export async function updateWord(
  userId: string,
  wordId: string,
  input: UpdateWordRequest,
) {
  return request<UpdateWordResponse>(`/api/users/${userId}/words/${wordId}`, {
    body: input,
    method: "PUT",
  });
}

export async function normalizeWord(
  userId: string,
  input: NormalizeWordRequest,
) {
  return request<NormalizeWordResponse>(`/api/users/${userId}/words/normalize`, {
    body: input,
    method: "POST",
  });
}

export async function suggestWordDraft(
  userId: string,
  input: SuggestWordDraftRequest,
  signal?: AbortSignal,
) {
  return request<SuggestWordDraftResponse>(`/api/users/${userId}/words/suggest`, {
    body: input,
    method: "POST",
    signal,
  });
}

export async function getNextWordExercise(
  userId: string,
  input: GetNextWordExerciseRequest = {},
) {
  const searchParams = new URLSearchParams();

  if (input.exerciseType) {
    searchParams.set("exerciseType", input.exerciseType);
  }

  return request<GetNextWordExerciseResponse>(
    `/api/users/${userId}/exercises/next${
      searchParams.size > 0 ? `?${searchParams.toString()}` : ""
    }`,
  );
}

export async function submitWordExercise(
  userId: string,
  input: SubmitWordExerciseRequest,
) {
  return request<SubmitWordExerciseResponse>(
    `/api/users/${userId}/exercises/check`,
    {
      body: input,
      method: "POST",
    },
  );
}

async function request<T>(
  path: string,
  options: {
    body?: unknown;
    method?: string;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      "Content-Type": "application/json",
    },
    method: options.method ?? "GET",
    signal: options.signal,
  });

  const rawText = await response.text();
  const parsedBody = rawText ? (JSON.parse(rawText) as unknown) : null;

  if (!response.ok) {
    const message =
      typeof parsedBody === "object" &&
      parsedBody !== null &&
      "message" in parsedBody &&
      typeof parsedBody.message === "string"
        ? parsedBody.message
        : `Request failed with status ${response.status}.`;

    throw new ApiError(message);
  }

  return parsedBody as T;
}
