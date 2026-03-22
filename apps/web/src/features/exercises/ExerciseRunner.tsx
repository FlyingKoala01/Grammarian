import { useEffect, useMemo, useState } from "react";

import type {
  DocumentedExerciseType,
  StudyProgressSummary,
  WordExercise,
  WordExerciseResult,
} from "@grammarian/shared";
import {
  documentedExerciseTypes,
  isSupportedWordExerciseType,
} from "@grammarian/shared";

import { Button } from "@/components/ui/button";
import { HanziTracePad } from "@/features/exercises/HanziTracePad";
import { PinyinField } from "@/features/words/PinyinField";
import type { AppMessages } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n";

interface ExerciseRunnerProps {
  currentExercise: WordExercise | null;
  errorMessage: string | null;
  exerciseResult: WordExerciseResult | null;
  isLoadingExercise: boolean;
  isSubmittingAnswer: boolean;
  onLoadNextExercise: () => void | Promise<void>;
  onRetryExercise: () => void;
  onSelectExerciseType: (exerciseType: DocumentedExerciseType) => void;
  onSubmitAnswer: (answer: string) => void | Promise<void>;
  progress: StudyProgressSummary;
  selectedExerciseType: DocumentedExerciseType;
  wordCount: number;
}

export function ExerciseRunner({
  currentExercise,
  errorMessage,
  exerciseResult,
  isLoadingExercise,
  isSubmittingAnswer,
  onLoadNextExercise,
  onRetryExercise,
  onSelectExerciseType,
  onSubmitAnswer,
  progress,
  selectedExerciseType,
  wordCount,
}: ExerciseRunnerProps) {
  const { formatDateTime, messages } = useI18n();
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
  const exerciseHint =
    currentExercise && exerciseResult && !exerciseResult.isCorrect && failedSubmissionCount >= 2
      ? buildExerciseHint(currentExercise, exerciseResult, messages)
      : null;
  const selectedOption =
    exerciseOptions.find((option) => option.id === selectedExerciseType) ??
    exerciseOptions[0]!;
  const isSupportedSelection = isSupportedWordExerciseType(selectedOption.id);
  const canLoadExercise = wordCount > 0 && isSupportedSelection;

  return (
    <section className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-h-0 rounded-[1.5rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] xl:flex xl:flex-col xl:p-8">
        <div className="border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {currentExercise ? (
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  {selectedOption.label}
                </span>
              ) : null}
              {currentExercise ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                  {currentExercise.queueMode === "due"
                    ? messages.dueNow
                    : messages.reviewScheduled}
                </span>
              ) : null}
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                {messages.wordsCount(wordCount)}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                {formatReviewQueueSummary(progress, messages, formatDateTime)}
              </span>
            </div>

            {canLoadExercise ? (
              <Button className="rounded-xl" onClick={onLoadNextExercise}>
                {currentExercise || exerciseResult ? messages.next : messages.loadExercise}
              </Button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {exerciseOptions.map((option) => {
              const isActive = selectedExerciseType === option.id;

              return (
                <button
                  className={`rounded-[1.2rem] border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                  }`}
                  key={option.id}
                  onClick={() => onSelectExerciseType(option.id)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{option.label}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                        isActive
                          ? "bg-white/15 text-white"
                          : option.isAvailable
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {option.isAvailable
                        ? messages.exerciseStatusAvailable
                        : messages.exerciseStatusPlanned}
                    </span>
                  </div>
                  <p
                    className={`mt-3 text-sm leading-6 ${
                      isActive ? "text-white/82" : "text-slate-600"
                    }`}
                  >
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col pt-6">
          {wordCount === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm leading-7 text-slate-600">
              {messages.exerciseEmpty}
            </div>
          ) : null}

          {wordCount > 0 && !isSupportedSelection ? (
            <div className="flex flex-1 items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm leading-7 text-slate-600">
              {selectedOption?.unavailableMessage ??
                "This exercise family is planned, but it still needs dedicated content and generation logic."}
            </div>
          ) : null}

          {canLoadExercise && isLoadingExercise ? (
            <div className="flex flex-1 items-center justify-center rounded-[1.25rem] border border-slate-200 bg-slate-50 px-6 text-center text-sm leading-7 text-slate-600">
              {messages.exerciseLoading}
            </div>
          ) : null}

          {canLoadExercise && !isLoadingExercise && !currentExercise ? (
            <div className="flex flex-1 items-center justify-center rounded-[1.25rem] border border-slate-200 bg-slate-50 px-6 text-center text-sm leading-7 text-slate-600">
              {selectedOption.description}
            </div>
          ) : null}

          {canLoadExercise && !isLoadingExercise && currentExercise ? (
            <div className="flex min-h-0 flex-1 flex-col justify-between gap-6">
              <div>
                <h2 className="max-w-4xl text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  {currentExercise.promptText}
                </h2>
                {currentExercise.promptSecondaryText ? (
                  <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                    {currentExercise.promptSecondaryText}
                  </p>
                ) : null}
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {isTraceExercise && currentExercise?.traceCharacters?.length ? (
                  <HanziTracePad
                    characters={currentExercise.traceCharacters}
                    disabled={isSubmittingAnswer || Boolean(exerciseResult)}
                    onChange={setAnswer}
                    onRequestTextFallback={() => setUseTraceTextFallback(true)}
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
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    {currentExercise.inputLabel}
                    <input
                      className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-lg text-slate-950 outline-none transition focus:border-amber-500"
                      disabled={isSubmittingAnswer || Boolean(exerciseResult)}
                      onChange={(event) => setAnswer(event.target.value)}
                      placeholder={currentExercise.inputPlaceholder}
                      required
                      value={answer}
                    />
                  </label>
                )}

                {errorMessage ? (
                  <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                    {errorMessage}
                  </div>
                ) : null}

                {!exerciseResult ? (
                  <div className="flex justify-end border-t border-slate-200 pt-4">
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
          ) : null}
        </div>
      </div>

      <aside className="min-h-0 rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] xl:flex xl:flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {exerciseResult ? (
            <div className="space-y-4">
              <div
                className={`rounded-[1.25rem] border px-4 py-4 ${
                  exerciseResult.isCorrect
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <p className="text-lg font-semibold text-slate-950">
                  {exerciseResult.feedbackShort}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
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
          ) : currentExercise ? (
            <div className="space-y-3">
              <SideNote
                label={selectedOption.label}
                value={selectedOption.description}
              />
              <SideNote
                label={messages.reviewQueue}
                value={formatReviewQueueDetail(progress, messages, formatDateTime)}
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
              <SideNote label={selectedOption.label} value={selectedOption.description} />
              <SideNote
                label={messages.exerciseImplementationStatus}
                value={
                  selectedOption.isAvailable
                    ? messages.exerciseImplementedInfo
                    : selectedOption.unavailableMessage
                }
              />
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}

function AnswerTile({ label, value }: { label: string; value: string }) {
  const { messages } = useI18n();

  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-base font-medium text-slate-900">
        {value || messages.noAnswerRecorded}
      </p>
    </div>
  );
}

function SideNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-700">{value}</p>
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
  | "exerciseOptionSentenceUnderstandingDescription"
  | "exerciseOptionSentenceUnderstandingLabel"
  | "exerciseOptionSentenceUnderstandingUnavailableMessage"
>) {
  const optionByType: Record<
    DocumentedExerciseType,
    {
      description: string;
      id: DocumentedExerciseType;
      isAvailable: boolean;
      label: string;
      unavailableMessage: string;
    }
  > = {
    character_recognition: {
      description: messages.exerciseOptionCharacterRecognitionDescription,
      id: "character_recognition",
      isAvailable: true,
      label: messages.exerciseOptionCharacterRecognitionLabel,
      unavailableMessage: "",
    },
    character_writing: {
      description: messages.exerciseOptionCharacterWritingDescription,
      id: "character_writing",
      isAvailable: true,
      label: messages.exerciseOptionCharacterWritingLabel,
      unavailableMessage: "",
    },
    gap_fill: {
      description: messages.exerciseOptionGapFillDescription,
      id: "gap_fill",
      isAvailable: false,
      label: messages.exerciseOptionGapFillLabel,
      unavailableMessage: messages.exerciseOptionGapFillUnavailableMessage,
    },
    pinyin_recognition: {
      description: messages.exerciseOptionPinyinRecognitionDescription,
      id: "pinyin_recognition",
      isAvailable: true,
      label: messages.exerciseOptionPinyinRecognitionLabel,
      unavailableMessage: "",
    },
    sentence_understanding: {
      description: messages.exerciseOptionSentenceUnderstandingDescription,
      id: "sentence_understanding",
      isAvailable: false,
      label: messages.exerciseOptionSentenceUnderstandingLabel,
      unavailableMessage:
        messages.exerciseOptionSentenceUnderstandingUnavailableMessage,
    },
  };

  return documentedExerciseTypes.map((exerciseType) => optionByType[exerciseType]);
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

function formatReviewQueueSummary(
  progress: StudyProgressSummary,
  messages: {
    dueNowCount: (count: number) => string;
    nextReviewShort: (date: string) => string;
    nothingDue: string;
  },
  formatDateTime: (value: string) => string,
) {
  if (progress.dueReviewCount > 0) {
    return messages.dueNowCount(progress.dueReviewCount);
  }

  if (!progress.nextReviewAt) {
    return messages.nothingDue;
  }

  return messages.nextReviewShort(formatDateTime(progress.nextReviewAt));
}

function formatReviewQueueDetail(
  progress: StudyProgressSummary,
  messages: {
    nextReview: (date: string) => string;
    reviewDueDetail: (count: number) => string;
    reviewNothingDue: string;
  },
  formatDateTime: (value: string) => string,
) {
  if (progress.dueReviewCount > 0) {
    return messages.reviewDueDetail(progress.dueReviewCount);
  }

  if (!progress.nextReviewAt) {
    return messages.reviewNothingDue;
  }

  return messages.nextReview(formatDateTime(progress.nextReviewAt));
}
