import { useEffect, useState, type CSSProperties } from "react";
import logoNoBackground from "../assets/logo_no_background.png";
import { BookMarked, BrainCircuit, Sparkles, type LucideIcon } from "lucide-react";

import type {
  AppLocale,
  CreateWordResponse,
  DocumentedExerciseType,
  GetNextWordExerciseRequest,
  LearnerProfile,
  SuggestWordDraftRequest,
  StudyProgressSummary,
  StudyWord,
  UpdateWordResponse,
  WordExercise,
  WordExerciseResult,
} from "@grammarian/shared";
import {
  defaultAppLocale,
  isAppLocale,
  isSupportedWordExerciseType,
} from "@grammarian/shared";

import { ThemeToggle } from "@/components/ThemeToggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DemoLoginCard } from "@/features/auth/DemoLoginCard";
import { ExerciseRunner } from "@/features/exercises/ExerciseRunner";
import type { ExerciseMode } from "@/features/exercises/exercise-mode";
import { AppSidebar } from "@/features/shell/AppSidebar";
import { WordManager } from "@/features/words/WordManager";
import {
  createWord,
  demoLogin,
  getNextWordExercise,
  getUser,
  listWords,
  suggestWordDraft,
  submitWordExercise,
  updateUserPreferences,
  updateWord,
} from "@/lib/api";
import { getMessagesForLocale, I18nProvider } from "@/lib/i18n";
import {
  applyThemeMode,
  getInitialThemeMode,
  themeStorageKey,
  type AppThemeMode,
} from "@/lib/theme";

const sessionStorageKey = "grammarian.demo-user-id";
const preferredLanguageStorageKey = "grammarian.preferred-language";

type ActiveView = "dictionary" | "exercises";

type SessionState =
  | { status: "loading" }
  | { errorMessage?: string; status: "signed_out" }
  | {
      progress: StudyProgressSummary;
      status: "ready";
      user: LearnerProfile;
    };

export function App() {
  const [preferredLanguage, setPreferredLanguage] = useState<AppLocale>(
    readStoredPreferredLanguage,
  );
  const [themeMode, setThemeMode] = useState<AppThemeMode>(getInitialThemeMode);
  const [activeView, setActiveView] = useState<ActiveView>("dictionary");
  const [exerciseErrorMessage, setExerciseErrorMessage] = useState<
    string | null
  >(null);
  const [exerciseResult, setExerciseResult] =
    useState<WordExerciseResult | null>(null);
  const [selectedExerciseMode, setSelectedExerciseMode] =
    useState<ExerciseMode | null>(null);
  const [isExerciseLoading, setIsExerciseLoading] = useState(false);
  const [isExerciseSubmitting, setIsExerciseSubmitting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSavingWord, setIsSavingWord] = useState(false);
  const [isUpdatingPreferredLanguage, setIsUpdatingPreferredLanguage] =
    useState(false);
  const [sessionState, setSessionState] = useState<SessionState>({
    status: "loading",
  });
  const [wordErrorMessage, setWordErrorMessage] = useState<string | null>(null);
  const [words, setWords] = useState<StudyWord[]>([]);
  const [currentExercise, setCurrentExercise] = useState<WordExercise | null>(
    null,
  );
  const appLocale =
    sessionState.status === "ready"
      ? sessionState.user.preferredLanguage
      : preferredLanguage;
  const messages = getMessagesForLocale(appLocale);

  useEffect(() => {
    const savedUserId = window.localStorage.getItem(sessionStorageKey);

    if (!savedUserId) {
      setSessionState({ status: "signed_out" });
      return;
    }

    void restoreSession(savedUserId);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(preferredLanguageStorageKey, preferredLanguage);
  }, [preferredLanguage]);

  useEffect(() => {
    window.localStorage.setItem(themeStorageKey, themeMode);
    applyThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (sessionState.status !== "ready" || activeView !== "exercises") {
      return;
    }

    if (
      !selectedExerciseMode ||
      words.length === 0 ||
      currentExercise ||
      isExerciseLoading ||
      exerciseResult ||
      (selectedExerciseMode !== "random" &&
        !isSupportedWordExerciseType(selectedExerciseMode))
    ) {
      return;
    }

    void loadNextExercise(buildExerciseRequest(selectedExerciseMode));
  }, [
    activeView,
    currentExercise,
    exerciseResult,
    isExerciseLoading,
    selectedExerciseMode,
    sessionState,
    words.length,
  ]);

  async function restoreSession(userId: string) {
    try {
      const [userResponse, wordsResponse] = await Promise.all([
        getUser(userId),
        listWords(userId),
      ]);

      setSessionState({
        progress: userResponse.progress,
        status: "ready",
        user: userResponse.user,
      });
      setPreferredLanguage(userResponse.user.preferredLanguage);
      setWords(wordsResponse.words);
    } catch (error) {
      window.localStorage.removeItem(sessionStorageKey);
      setSessionState({
        errorMessage:
          error instanceof Error
            ? error.message
            : "The saved session could not be restored.",
        status: "signed_out",
      });
    }
  }

  async function handleLogin(displayName: string) {
    setIsLoggingIn(true);

    try {
      const loginResponse = await demoLogin({
        displayName,
        preferredLanguage,
      });
      const wordsResponse = await listWords(loginResponse.user.id);

      window.localStorage.setItem(sessionStorageKey, loginResponse.user.id);
      setSessionState({
        progress: loginResponse.progress,
        status: "ready",
        user: loginResponse.user,
      });
      setPreferredLanguage(loginResponse.user.preferredLanguage);
      setWords(wordsResponse.words);
      setActiveView("dictionary");
    } catch (error) {
      setSessionState({
        errorMessage:
          error instanceof Error ? error.message : "Login failed unexpectedly.",
        status: "signed_out",
      });
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handlePreferredLanguageChange(nextLanguage: AppLocale) {
    setPreferredLanguage(nextLanguage);

    if (sessionState.status !== "ready") {
      return;
    }

    setIsUpdatingPreferredLanguage(true);

    try {
      const userResponse = await updateUserPreferences(sessionState.user.id, {
        preferredLanguage: nextLanguage,
      });

      setSessionState({
        progress: userResponse.progress,
        status: "ready",
        user: userResponse.user,
      });
    } catch (error) {
      setPreferredLanguage(sessionState.user.preferredLanguage);
      setWordErrorMessage(
        error instanceof Error
          ? error.message
          : "The language preference could not be updated.",
      );
    } finally {
      setIsUpdatingPreferredLanguage(false);
    }
  }

  async function handleAddWord(input: {
    pinyinCanonical: string;
    simplified: string;
    translation: string;
  }): Promise<CreateWordResponse | null> {
    if (sessionState.status !== "ready") {
      return null;
    }

    setIsSavingWord(true);
    setWordErrorMessage(null);

    try {
      const createWordResponse = await createWord(sessionState.user.id, input);

      setWords((currentWords) => [createWordResponse.word, ...currentWords]);
      return createWordResponse;
    } catch (error) {
      setWordErrorMessage(
        error instanceof Error ? error.message : "The word could not be saved.",
      );
      return null;
    } finally {
      setIsSavingWord(false);
    }
  }

  async function handleUpdateWord(
    wordId: string,
    input: {
      pinyinCanonical: string;
      simplified: string;
      translation: string;
    },
  ): Promise<UpdateWordResponse | null> {
    if (sessionState.status !== "ready") {
      return null;
    }

    setIsSavingWord(true);
    setWordErrorMessage(null);

    try {
      const updateWordResponse = await updateWord(
        sessionState.user.id,
        wordId,
        input,
      );

      setWords((currentWords) =>
        currentWords.map((word) =>
          word.id === wordId ? updateWordResponse.word : word,
        ),
      );

      return updateWordResponse;
    } catch (error) {
      setWordErrorMessage(
        error instanceof Error
          ? error.message
          : "The word could not be updated.",
      );
      return null;
    } finally {
      setIsSavingWord(false);
    }
  }

  async function handleSuggestWord(
    draft: {
      pinyinCanonical?: string;
      simplified?: string;
      translation?: string;
    },
    mode: SuggestWordDraftRequest["mode"] = "hybrid",
    signal?: AbortSignal,
  ) {
    if (sessionState.status !== "ready") {
      throw new Error("You need to log in before requesting word suggestions.");
    }

    return suggestWordDraft(sessionState.user.id, { draft, mode }, signal);
  }

  async function loadNextExercise(
    input: GetNextWordExerciseRequest = buildExerciseRequest(
      selectedExerciseMode,
    ),
  ) {
    if (sessionState.status !== "ready") {
      return;
    }

    setIsExerciseLoading(true);
    setExerciseErrorMessage(null);
    setCurrentExercise(null);
    setExerciseResult(null);

    try {
      const exerciseResponse = await getNextWordExercise(
        sessionState.user.id,
        input,
      );

      setCurrentExercise(exerciseResponse.exercise);
      setSessionState((currentState) =>
        currentState.status === "ready"
          ? {
              ...currentState,
              progress: exerciseResponse.progress,
            }
          : currentState,
      );
    } catch (error) {
      setCurrentExercise(null);
      setExerciseErrorMessage(
        error instanceof Error
          ? error.message
          : "The next exercise could not be loaded.",
      );
    } finally {
      setIsExerciseLoading(false);
    }
  }

  async function handleSubmitExercise(answer: string) {
    if (sessionState.status !== "ready" || !currentExercise) {
      return;
    }

    setIsExerciseSubmitting(true);
    setExerciseErrorMessage(null);

    try {
      const submissionResponse = await submitWordExercise(
        sessionState.user.id,
        {
          answer,
          exerciseId: currentExercise.exerciseId,
        },
      );

      setExerciseResult(submissionResponse.result);
      setSessionState((currentState) =>
        currentState.status === "ready"
          ? {
              ...currentState,
              progress: submissionResponse.progress,
            }
          : currentState,
      );
    } catch (error) {
      setExerciseErrorMessage(
        error instanceof Error
          ? error.message
          : "The answer could not be checked.",
      );
    } finally {
      setIsExerciseSubmitting(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(sessionStorageKey);
    setActiveView("dictionary");
    setCurrentExercise(null);
    setExerciseErrorMessage(null);
    setExerciseResult(null);
    setSelectedExerciseMode(null);
    setSessionState({ status: "signed_out" });
    setWordErrorMessage(null);
    setWords([]);
  }

  function handleSelectExerciseMode(exerciseMode: ExerciseMode) {
    setSelectedExerciseMode(exerciseMode);
    setCurrentExercise(null);
    setExerciseErrorMessage(null);
    setExerciseResult(null);
  }

  function handleResetExerciseMode() {
    setSelectedExerciseMode(null);
    setCurrentExercise(null);
    setExerciseErrorMessage(null);
    setExerciseResult(null);
  }

  function handleRetryExercise() {
    setExerciseErrorMessage(null);
    setExerciseResult(null);
  }

  function handleToggleTheme() {
    setThemeMode((currentThemeMode) =>
      currentThemeMode === "dark" ? "light" : "dark",
    );
  }

  if (sessionState.status === "loading") {
    return (
      <I18nProvider locale={appLocale}>
        <main className="min-h-screen px-6 py-10 text-slate-950 dark:text-stone-100">
          <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
            <div className="rounded-[2rem] border border-white/80 bg-white/85 px-8 py-10 text-center shadow-[0_25px_90px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 dark:text-amber-300">
                Grammarian
              </p>
              <h1 className="mt-4 text-3xl font-semibold">
                {messages.restoringSession}
              </h1>
            </div>
          </section>
        </main>
      </I18nProvider>
    );
  }

  if (sessionState.status === "signed_out") {
    return (
      <I18nProvider locale={appLocale}>
        <main className="min-h-screen px-4 py-6 text-slate-950 dark:text-stone-100 sm:px-6">
          <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center justify-center">
            <div className="w-full">
              <div className="mx-auto mb-8 flex max-w-xl flex-col items-center text-center">
                <img
                  alt="Grammarian logo"
                  className="h-24 w-24 object-contain sm:h-28 sm:w-28"
                  src={logoNoBackground}
                />
                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-stone-50 sm:text-4xl">
                  Grammarian
                </h1>
                <p className="mt-3 max-w-lg text-base leading-7 text-slate-600 dark:text-stone-300">
                  {messages.appDescription}
                </p>
              </div>

              <div className="mx-auto w-full max-w-xl">
                <DemoLoginCard
                  errorMessage={sessionState.errorMessage}
                  isSubmitting={isLoggingIn}
                  onLogin={handleLogin}
                  onPreferredLanguageChange={handlePreferredLanguageChange}
                  preferredLanguage={preferredLanguage}
                />
              </div>
            </div>
          </section>
        </main>
      </I18nProvider>
    );
  }

  const progress: StudyProgressSummary = {
    ...sessionState.progress,
    totalWords: words.length,
  };

  return (
    <I18nProvider locale={appLocale}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "18rem",
            "--sidebar-width-mobile": "18rem",
          } as CSSProperties
        }
      >
        <AppSidebar
          activeView={activeView}
          isUpdatingPreferredLanguage={isUpdatingPreferredLanguage}
          onChangePreferredLanguage={handlePreferredLanguageChange}
          onChangeView={setActiveView}
          onLogout={handleLogout}
          onToggleTheme={handleToggleTheme}
          preferredLanguage={sessionState.user.preferredLanguage}
          progress={progress}
          themeMode={themeMode}
          user={sessionState.user}
        />

        <SidebarInset>
          <main className="min-h-screen p-3 lg:p-4">
            <div className="flex min-h-[calc(100vh-1.5rem)] flex-col gap-3 lg:min-h-[calc(100vh-2rem)]">
              <div className="sticky top-3 z-20 lg:hidden">
                <div className="rounded-[1.35rem] border border-white/80 bg-white/85 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-[rgba(28,21,18,0.88)] dark:shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger className="h-11 w-11 rounded-2xl bg-white/75 dark:bg-white/8" />
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 shadow-[0_12px_28px_rgba(217,119,6,0.18)] dark:bg-[#9f561c] dark:text-[#fff7ef] dark:shadow-[0_14px_30px_rgba(66,28,8,0.35)]">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950 dark:text-stone-100">
                          Grammarian
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-stone-400">
                          {sessionState.user.displayName}
                        </p>
                      </div>
                    </div>
                    <ThemeToggle
                      className="h-11 w-11 rounded-2xl border-slate-200 bg-white/75 dark:border-white/12 dark:bg-white/8"
                      compact
                      mode={themeMode}
                      onToggle={handleToggleTheme}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-[1.1rem] bg-slate-100/80 p-1 dark:bg-white/[0.06]">
                    <MobileViewButton
                      active={activeView === "dictionary"}
                      icon={BookMarked}
                      label={messages.dictionary}
                      onClick={() => setActiveView("dictionary")}
                    />
                    <MobileViewButton
                      active={activeView === "exercises"}
                      icon={BrainCircuit}
                      label={messages.exercises}
                      onClick={() => setActiveView("exercises")}
                    />
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1">
                {activeView === "dictionary" ? (
                  <WordManager
                    errorMessage={wordErrorMessage}
                    isSavingWord={isSavingWord}
                    onAddWord={handleAddWord}
                    onSuggestWord={handleSuggestWord}
                    onUpdateWord={handleUpdateWord}
                    preferredLanguage={sessionState.user.preferredLanguage}
                    words={words}
                  />
                ) : (
                  <ExerciseRunner
                    currentExercise={currentExercise}
                    errorMessage={exerciseErrorMessage}
                    exerciseResult={exerciseResult}
                    isLoadingExercise={isExerciseLoading}
                    isSubmittingAnswer={isExerciseSubmitting}
                    onLoadNextExercise={loadNextExercise}
                    onResetExerciseMode={handleResetExerciseMode}
                    onRetryExercise={handleRetryExercise}
                    onSelectExerciseMode={handleSelectExerciseMode}
                    onSubmitAnswer={handleSubmitExercise}
                    selectedExerciseMode={selectedExerciseMode}
                    themeMode={themeMode}
                    wordCount={words.length}
                  />
                )}
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </I18nProvider>
  );
}

function MobileViewButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex items-center justify-center gap-2 rounded-[0.95rem] px-3 py-3 text-[13px] font-medium transition ${
        active
          ? "bg-white text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.12)] dark:bg-amber-300 dark:text-stone-950 dark:shadow-[0_12px_24px_rgba(0,0,0,0.28)]"
          : "text-slate-700 hover:bg-white/70 dark:text-stone-200 dark:hover:bg-white/8"
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}

function readStoredPreferredLanguage(): AppLocale {
  const storedValue = window.localStorage.getItem(preferredLanguageStorageKey);

  return storedValue && isAppLocale(storedValue)
    ? storedValue
    : defaultAppLocale;
}

function buildExerciseRequest(
  exerciseMode: ExerciseMode | null,
): GetNextWordExerciseRequest {
  if (!exerciseMode || exerciseMode === "random") {
    return {};
  }

  return {
    exerciseType: exerciseMode,
  };
}
