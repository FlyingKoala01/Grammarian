import { useEffect, useMemo, useState } from "react";

import type {
  DocumentedExerciseType,
  WordExercise,
  WordExerciseResult,
} from "@grammarian/shared";
import {
  documentedExerciseTypes,
  isSupportedWordExerciseType,
} from "@grammarian/shared";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import type { ExerciseMode } from "@/features/exercises/exercise-mode";
import { HanziTracePad } from "@/features/exercises/HanziTracePad";
import { PinyinField } from "@/features/words/PinyinField";
import type { AppMessages } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n";
import type { AppThemeMode } from "@/lib/theme";

interface ExerciseRunnerProps {
  currentExercise: WordExercise | null;
  errorMessage: string | null;
  exerciseResult: WordExerciseResult | null;
  isLoadingExercise: boolean;
  isSubmittingAnswer: boolean;
  onLoadNextExercise: () => void | Promise<void>;
  onResetExerciseMode: () => void;
  onRetryExercise: () => void;
  onSelectExerciseMode: (exerciseMode: ExerciseMode) => void;
  onSubmitAnswer: (answer: string) => void | Promise<void>;
  selectedExerciseMode: ExerciseMode | null;
  themeMode: AppThemeMode;
  wordCount: number;
}

type ExerciseOption = {
  description: string;
  id: ExerciseMode;
  isAvailable: boolean;
  label: string;
  unavailableMessage: string;
};

export function ExerciseRunner({
  currentExercise,
  errorMessage,
  exerciseResult,
  isLoadingExercise,
  isSubmittingAnswer,
  onLoadNextExercise,
  onResetExerciseMode,
  onRetryExercise,
  onSelectExerciseMode,
  onSubmitAnswer,
  selectedExerciseMode,
  themeMode,
  wordCount,
}: ExerciseRunnerProps) {
  const { messages } = useI18n();
  const [answer, setAnswer] = useState("");
  const [failedSubmissionCount, setFailedSubmissionCount] = useState(0);
  const [useTraceTextFallback, setUseTraceTextFallback] = useState(false);
  const exerciseOptions = useMemo(() => buildExerciseOptions(messages), [messages]);

  useEffect(() => {
    setAnswer("");
    setFailedSubmissionCount(0);
    setUseTraceTextFallback(false);
  }, [currentExercise?.exerciseId]);

  useEffect(() => {
    if (!exerciseResult || exerciseResult.isCorrect) {
      return;
    }

    setFailedSubmissionCount((currentCount) => currentCount + 1);
  }, [exerciseResult]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmitAnswer(answer);
  }

  const canSubmit = answer.trim().length > 0;
  const isPinyinExercise = currentExercise?.kind === "pinyin";
  const isTraceExercise =
    currentExercise?.answerMode === "trace_character" &&
    Boolean(currentExercise.traceCharacters?.length) &&
    !useTraceTextFallback;
  const showChooser = selectedExerciseMode === null;
  const selectedOption = selectedExerciseMode
    ? exerciseOptions.find((option) => option.id === selectedExerciseMode) ?? null
    : null;
  const currentExerciseOption = currentExercise
    ? exerciseOptions.find((option) => option.id === currentExercise.exerciseType) ?? null
    : null;
  const isSupportedSelection =
    selectedExerciseMode === "random" ||
    (selectedExerciseMode
      ? isSupportedWordExerciseType(selectedExerciseMode)
      : false);
  const canLoadExercise = wordCount > 0 && !showChooser && isSupportedSelection;
  const exerciseHint =
    currentExercise && exerciseResult && !exerciseResult.isCorrect && failedSubmissionCount >= 2
      ? buildExerciseHint(currentExercise, exerciseResult, messages)
      : null;
  const feedbackClasses = exerciseResult
    ? exerciseResult.isCorrect
      ? {
          container:
            "border-emerald-200 bg-emerald-50 dark:border-emerald-500/28 dark:bg-emerald-500/12",
          detail: "text-emerald-800 dark:text-emerald-50/88",
          title: "text-emerald-950 dark:text-emerald-50",
        }
      : {
          container:
            "border-rose-200 bg-rose-50 dark:border-rose-500/28 dark:bg-rose-500/10",
          detail: "text-rose-800 dark:text-rose-50/88",
          title: "text-rose-950 dark:text-rose-50",
        }
    : null;
  const exercisePanelContent = exerciseResult ? (
    <div className="space-y-4">
      <div
        className={`rounded-[1.25rem] border px-4 py-4 ${feedbackClasses?.container ?? ""}`}
      >
        <p className={`text-lg font-semibold ${feedbackClasses?.title ?? "text-slate-950 dark:text-stone-50"}`}>
          {exerciseResult.feedbackShort}
        </p>
        <p className={`mt-2 text-sm leading-7 ${feedbackClasses?.detail ?? "text-slate-700 dark:text-stone-200"}`}>
          {exerciseResult.feedbackDetailed}
        </p>
      </div>

      <AnswerTile
        label={messages.yourAnswer}
        value={exerciseResult.normalizedAnswer}
      />
      <AnswerTile label={messages.expected} value={exerciseResult.idealAnswer} />
      <AnswerTile label={messages.fieldHanzi} value={exerciseResult.word.simplified} />
      <AnswerTile
        label={messages.fieldPinyin}
        value={exerciseResult.word.pinyinCanonical}
      />
      <AnswerTile label={messages.meaning} value={exerciseResult.word.translation} />
      {exerciseHint ? (
        <SideNote label={messages.exerciseHint} value={exerciseHint} />
      ) : null}

      {canLoadExercise ? (
        <Button className="w-full rounded-xl" onClick={onLoadNextExercise}>
          {messages.nextExercise}
        </Button>
      ) : null}
      {!exerciseResult.isCorrect ? (
        <Button
          className="w-full rounded-xl"
          onClick={() => {
            setAnswer("");
            onRetryExercise();
          }}
          variant="outline"
        >
          {messages.retryExercise}
        </Button>
      ) : null}
    </div>
  ) : showChooser ? (
    <div className="space-y-3">
      <SideNote label={messages.exercises} value={messages.exerciseChooseMode} />
      <SideNote
        label={messages.exerciseOptionRandomLabel}
        value={messages.exerciseOptionRandomDescription}
      />
    </div>
  ) : currentExercise ? (
    <div className="space-y-3">
      {selectedOption?.id === "random" ? (
        <SideNote label={selectedOption.label} value={selectedOption.description} />
      ) : null}
      <SideNote
        label={currentExerciseOption?.label ?? selectedOption?.label ?? messages.exercises}
        value={
          currentExerciseOption?.description ??
          selectedOption?.description ??
          messages.exerciseChooseMode
        }
      />
      <SideNote
        label={messages.answerWith}
        value={
          isTraceExercise
            ? messages.traceAnswerWith
            : currentExercise.inputLabel
        }
      />
      <SideNote
        label={messages.placeholder}
        value={
          isTraceExercise
            ? messages.traceInstructions
            : currentExercise.inputPlaceholder
        }
      />
      {currentExercise.kind === "pinyin" ? (
        <SideNote
          label={messages.fieldPinyin}
          value={messages.pinyinAnswerHint}
        />
      ) : null}
    </div>
  ) : (
    <div className="space-y-3">
      <SideNote
        label={selectedOption?.label ?? messages.exercises}
        value={selectedOption?.description ?? messages.exerciseChooseMode}
      />
      <SideNote
        label={messages.exerciseImplementationStatus}
        value={
          selectedOption?.isAvailable
            ? messages.exerciseImplementedInfo
            : selectedOption?.unavailableMessage ?? messages.exerciseChooseMode
        }
      />
    </div>
  );

  return (
    <section className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-h-0 rounded-[1.5rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_22px_65px_rgba(0,0,0,0.34)] xl:flex xl:flex-col xl:p-8">
        <div className="border-b border-slate-200 pb-5 dark:border-white/10">
          {showChooser ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-stone-400">
                    {messages.exercises}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-stone-300">
                    {messages.exerciseChooseMode}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-stone-200">
                  {messages.wordsCount(wordCount)}
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {exerciseOptions.map((option) => (
                  <button
                    className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4 text-left text-slate-900 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-stone-100 dark:hover:border-white/20"
                    key={option.id}
                    onClick={() => onSelectExerciseMode(option.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{option.label}</p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                          option.isAvailable
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-100"
                            : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-stone-400"
                        }`}
                      >
                        {option.isAvailable
                          ? messages.exerciseStatusAvailable
                          : messages.exerciseStatusPlanned}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-stone-300">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink onClick={onResetExerciseMode}>
                        {messages.exercises}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{selectedOption?.label ?? messages.exercises}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              {canLoadExercise ? (
                <Button className="rounded-xl" onClick={onLoadNextExercise}>
                  {currentExercise || exerciseResult ? messages.next : messages.loadExercise}
                </Button>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col pt-6">
          {showChooser ? (
            <div className="flex flex-1 items-center justify-center rounded-[1.25rem] border border-slate-200 bg-slate-50 px-6 text-center text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-300">
              {wordCount === 0 ? messages.exerciseEmpty : messages.exerciseChooseMode}
            </div>
          ) : wordCount === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm leading-7 text-slate-600 dark:border-white/14 dark:bg-white/5 dark:text-stone-300">
              {messages.exerciseEmpty}
            </div>
          ) : !isSupportedSelection ? (
            <div className="flex flex-1 items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm leading-7 text-slate-600 dark:border-white/14 dark:bg-white/5 dark:text-stone-300">
              {selectedOption?.unavailableMessage ??
                "This exercise family is planned, but it still needs dedicated content and generation logic."}
            </div>
          ) : isLoadingExercise ? (
            <div className="flex flex-1 items-center justify-center rounded-[1.25rem] border border-slate-200 bg-slate-50 px-6 text-center text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-300">
              {messages.exerciseLoading}
            </div>
          ) : !currentExercise ? (
            <div className="flex flex-1 items-center justify-center rounded-[1.25rem] border border-slate-200 bg-slate-50 px-6 text-center text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-300">
              {selectedOption?.description ?? messages.exerciseChooseMode}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col justify-between gap-6">
              <div className="space-y-5">
                {exerciseResult ? (
                  <div className="xl:hidden">
                    {exercisePanelContent}
                  </div>
                ) : null}

                <div>
                <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-slate-950 dark:text-stone-50 sm:text-4xl lg:text-5xl">
                  {currentExercise.promptText}
                </h2>
                {currentExercise.promptSecondaryText ? (
                  <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-stone-300">
                    {currentExercise.promptSecondaryText}
                  </p>
                ) : null}
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {isTraceExercise && currentExercise.traceCharacters?.length ? (
                  <HanziTracePad
                    characters={currentExercise.traceCharacters}
                    disabled={isSubmittingAnswer || Boolean(exerciseResult)}
                    onChange={setAnswer}
                    onRequestTextFallback={() => setUseTraceTextFallback(true)}
                    themeMode={themeMode}
                  />
                ) : isPinyinExercise ? (
                  <PinyinField
                    disabled={isSubmittingAnswer || Boolean(exerciseResult)}
                    helperTitle={messages.answerHelper}
                    label={currentExercise.inputLabel}
                    onChange={setAnswer}
                    placeholder={currentExercise.inputPlaceholder}
                    value={answer}
                  />
                ) : (
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-stone-300">
                    {currentExercise.inputLabel}
                    <input
                      className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-lg text-slate-950 outline-none transition focus:border-amber-500 dark:border-white/12 dark:bg-white/6 dark:text-stone-100 dark:placeholder:text-stone-500"
                      disabled={isSubmittingAnswer || Boolean(exerciseResult)}
                      onChange={(event) => setAnswer(event.target.value)}
                      placeholder={currentExercise.inputPlaceholder}
                      required
                      value={answer}
                    />
                  </label>
                )}

                {errorMessage ? (
                  <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700 dark:border-rose-500/28 dark:bg-rose-500/10 dark:text-rose-100">
                    {errorMessage}
                  </div>
                ) : null}

                {!exerciseResult ? (
                  <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-white/10">
                    <Button
                      className="rounded-xl"
                      disabled={!canSubmit || isSubmittingAnswer}
                      type="submit"
                    >
                      {isSubmittingAnswer
                        ? messages.checkingAnswer
                        : messages.checkAnswer}
                    </Button>
                  </div>
                ) : null}
              </form>
            </div>
          )}
        </div>
      </div>

      <aside className="hidden min-h-0 rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_22px_65px_rgba(0,0,0,0.34)] xl:flex xl:flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">{exercisePanelContent}</div>
      </aside>
    </section>
  );
}

function AnswerTile({ label, value }: { label: string; value: string }) {
  const { messages } = useI18n();

  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-stone-400">
        {label}
      </p>
      <p className="mt-2 text-base font-medium text-slate-900 dark:text-stone-100">
        {value || messages.noAnswerRecorded}
      </p>
    </div>
  );
}

function SideNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-stone-400">
        {label}
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-stone-200">{value}</p>
    </div>
  );
}

function buildExerciseOptions(messages: Pick<
  AppMessages,
  | "exerciseOptionCharacterRecognitionDescription"
  | "exerciseOptionCharacterRecognitionLabel"
  | "exerciseOptionCharacterWritingDescription"
  | "exerciseOptionCharacterWritingLabel"
  | "exerciseOptionGapFillDescription"
  | "exerciseOptionGapFillLabel"
  | "exerciseOptionGapFillUnavailableMessage"
  | "exerciseOptionPinyinRecognitionDescription"
  | "exerciseOptionPinyinRecognitionLabel"
  | "exerciseOptionRandomDescription"
  | "exerciseOptionRandomLabel"
  | "exerciseOptionSentenceUnderstandingDescription"
  | "exerciseOptionSentenceUnderstandingLabel"
  | "exerciseOptionSentenceUnderstandingUnavailableMessage"
>): ExerciseOption[] {
  const optionByType: Record<
    DocumentedExerciseType,
    Omit<ExerciseOption, "id">
  > = {
    character_recognition: {
      description: messages.exerciseOptionCharacterRecognitionDescription,
      isAvailable: true,
      label: messages.exerciseOptionCharacterRecognitionLabel,
      unavailableMessage: "",
    },
    character_writing: {
      description: messages.exerciseOptionCharacterWritingDescription,
      isAvailable: true,
      label: messages.exerciseOptionCharacterWritingLabel,
      unavailableMessage: "",
    },
    gap_fill: {
      description: messages.exerciseOptionGapFillDescription,
      isAvailable: false,
      label: messages.exerciseOptionGapFillLabel,
      unavailableMessage: messages.exerciseOptionGapFillUnavailableMessage,
    },
    pinyin_recognition: {
      description: messages.exerciseOptionPinyinRecognitionDescription,
      isAvailable: true,
      label: messages.exerciseOptionPinyinRecognitionLabel,
      unavailableMessage: "",
    },
    sentence_understanding: {
      description: messages.exerciseOptionSentenceUnderstandingDescription,
      isAvailable: false,
      label: messages.exerciseOptionSentenceUnderstandingLabel,
      unavailableMessage:
        messages.exerciseOptionSentenceUnderstandingUnavailableMessage,
    },
  };

  return [
    {
      description: messages.exerciseOptionRandomDescription,
      id: "random",
      isAvailable: true,
      label: messages.exerciseOptionRandomLabel,
      unavailableMessage: "",
    },
    ...documentedExerciseTypes.map((exerciseType) => ({
      id: exerciseType,
      ...optionByType[exerciseType],
    })),
  ];
}

function buildExerciseHint(
  currentExercise: WordExercise,
  exerciseResult: WordExerciseResult,
  messages: Pick<
    AppMessages,
    | "pinyinExerciseHint"
    | "recognitionExerciseHint"
    | "writingExerciseHint"
  >,
) {
  if (currentExercise.kind === "recognition") {
    const words = splitHintParts(exerciseResult.word.translation);

    return messages.recognitionExerciseHint(
      buildInitialsHint(words),
      words.length || 1,
    );
  }

  if (currentExercise.kind === "pinyin") {
    const syllables = splitHintParts(exerciseResult.word.pinyinCanonical);

    return messages.pinyinExerciseHint(
      buildInitialsHint(syllables),
      syllables.length || 1,
    );
  }

  const characters = Array.from(exerciseResult.word.simplified);

  return messages.writingExerciseHint(
    characters.length || 1,
    characters[0] ?? exerciseResult.word.simplified,
    exerciseResult.word.pinyinCanonical,
  );
}

function splitHintParts(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean);
}

function buildInitialsHint(parts: string[]) {
  return parts
    .map((part) => `${Array.from(part)[0] ?? ""}...`)
    .join(" ");
}
