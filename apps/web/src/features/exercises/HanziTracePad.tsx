import { useEffect, useEffectEvent, useRef, useState } from "react";

import { buildTraceCompletedAnswer } from "@grammarian/shared";
import HanziWriter from "hanzi-writer";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface HanziTracePadProps {
  characters: string[];
  disabled: boolean;
  onChange: (value: string) => void;
  onRequestTextFallback: () => void;
}

type TraceStatus = "loading" | "ready" | "complete" | "error";

export function HanziTracePad({
  characters,
  disabled,
  onChange,
  onRequestTextFallback,
}: HanziTracePadProps) {
  const { messages } = useI18n();
  const writerRef = useRef<HanziWriter | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const completedMistakesRef = useRef(0);
  const hintedStrokeKeyRef = useRef<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hintedStrokeNumber, setHintedStrokeNumber] = useState<number | null>(null);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [status, setStatus] = useState<TraceStatus>("loading");
  const totalCharacters = characters.length;
  const currentCharacter = characters[currentIndex] ?? characters[0] ?? "";

  const handleLoadError = useEffectEvent(() => {
    setStatus("error");
    onChange("");
  });

  const handleLoadSuccess = useEffectEvent(() => {
    setStatus((currentStatus) =>
      currentStatus === "complete" ? currentStatus : "ready",
    );
  });

  const revealStrokeHint = useEffectEvent((strokeNumber: number) => {
    const writer = writerRef.current;
    const hintKey = `${currentIndex}:${strokeNumber}`;

    if (!writer || hintedStrokeKeyRef.current === hintKey) {
      return;
    }

    hintedStrokeKeyRef.current = hintKey;
    setHintedStrokeNumber(strokeNumber + 1);

    void writer.highlightStroke(strokeNumber);
    void writer.animateStroke(strokeNumber);
  });

  const startQuiz = useEffectEvent(
    async (writer: HanziWriter, nextCharacter: string, resetCharacter: boolean) => {
      setStatus("loading");
      onChange("");
      writer.cancelQuiz();

      if (resetCharacter) {
        await writer.setCharacter(nextCharacter);
      }

      await writer.quiz({
        acceptBackwardsStrokes: false,
        highlightOnComplete: true,
        leniency: 1.1,
        onComplete: ({ totalMistakes }) => {
          void handleCharacterComplete(totalMistakes);
        },
        onCorrectStroke: ({ totalMistakes }) => {
          setHintedStrokeNumber(null);
          setMistakeCount(completedMistakesRef.current + totalMistakes);
        },
        onMistake: ({ mistakesOnStroke, strokeNum, totalMistakes }) => {
          setMistakeCount(completedMistakesRef.current + totalMistakes);

          if (mistakesOnStroke >= 2) {
            revealStrokeHint(strokeNum);
          }
        },
        showHintAfterMisses: false,
      });
    },
  );

  const handleCharacterComplete = useEffectEvent(async (characterMistakes: number) => {
    const nextMistakeCount = completedMistakesRef.current + characterMistakes;

    completedMistakesRef.current = nextMistakeCount;
    hintedStrokeKeyRef.current = null;
    setHintedStrokeNumber(null);
    setMistakeCount(nextMistakeCount);

    if (currentIndex >= totalCharacters - 1) {
      setStatus("complete");
      onChange(buildTraceCompletedAnswer(nextMistakeCount));
      return;
    }

    const nextIndex = currentIndex + 1;
    const writer = writerRef.current;
    const nextCharacter = characters[nextIndex];

    if (!writer || !nextCharacter) {
      handleLoadError();
      return;
    }

    setCurrentIndex(nextIndex);

    try {
      await startQuiz(writer, nextCharacter, true);
    } catch {
      handleLoadError();
    }
  });

  useEffect(() => {
    const targetElement = targetRef.current;
    const initialCharacter = characters[0];

    if (!targetElement || !initialCharacter) {
      return;
    }

    completedMistakesRef.current = 0;
    hintedStrokeKeyRef.current = null;
    setCurrentIndex(0);
    setHintedStrokeNumber(null);
    setMistakeCount(0);
    setStatus("loading");
    targetElement.innerHTML = "";

    const writer = HanziWriter.create(targetElement, initialCharacter, {
      drawingColor: "#0f172a",
      highlightColor: "#c96a24",
      onLoadCharDataError: handleLoadError,
      onLoadCharDataSuccess: handleLoadSuccess,
      outlineColor: "#cbd5e1",
      padding: 18,
      renderer: "svg",
      showCharacter: false,
      showOutline: true,
      strokeColor: "#0f172a",
      width: 320,
      height: 320,
    });

    writerRef.current = writer;
    void startQuiz(writer, initialCharacter, false).catch(() => {
      handleLoadError();
    });

    return () => {
      writer.cancelQuiz();
      writerRef.current = null;
      targetElement.innerHTML = "";
    };
  }, [characters, handleLoadError, handleLoadSuccess, startQuiz]);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    writerRef.current?.cancelQuiz();
  }, [disabled]);

  async function handleRestart() {
    const writer = writerRef.current;
    const firstCharacter = characters[0];

    if (!writer || !firstCharacter || disabled) {
      return;
    }

    completedMistakesRef.current = 0;
    hintedStrokeKeyRef.current = null;
    setCurrentIndex(0);
    setHintedStrokeNumber(null);
    setMistakeCount(0);

    try {
      await startQuiz(writer, firstCharacter, true);
    } catch {
      handleLoadError();
    }
  }

  return (
    <div className="space-y-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                status === "complete"
                  ? "bg-emerald-100 text-emerald-700"
                  : status === "error"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-200 text-slate-700"
              }`}
            >
              {status === "loading"
                ? messages.traceLoading
                : status === "complete"
                  ? messages.traceComplete
                  : status === "error"
                    ? messages.traceDrawingUnavailable
                    : messages.traceProgress(currentIndex + 1, totalCharacters)}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
              {messages.traceMistakes(mistakeCount)}
            </span>
          </div>

          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            {messages.traceInstructions}
          </p>

          {hintedStrokeNumber ? (
            <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
              {messages.traceStrokeHint(hintedStrokeNumber)}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {characters.map((character, index) => {
              const isCompleted =
                status === "complete" ? true : index < currentIndex;
              const isCurrent =
                status !== "complete" && index === currentIndex && status !== "error";

              return (
                <span
                  className={`inline-flex min-w-10 items-center justify-center rounded-xl border px-3 py-2 text-lg font-semibold transition ${
                    isCompleted
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : isCurrent
                        ? "border-amber-300 bg-amber-50 text-amber-900"
                        : "border-slate-200 bg-white text-slate-500"
                  }`}
                  key={`${character}-${index}`}
                >
                  {character}
                </span>
              );
            })}
          </div>
        </div>

        <Button
          className="rounded-xl"
          disabled={disabled || status === "loading"}
          onClick={handleRestart}
          type="button"
          variant="outline"
        >
          {messages.traceRestart}
        </Button>
      </div>

      {status === "error" ? (
        <div className="rounded-[1.1rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
          <p>{messages.traceDrawingUnavailable}</p>
          <Button
            className="mt-3 rounded-xl"
            onClick={onRequestTextFallback}
            type="button"
            variant="outline"
          >
            {messages.traceDrawingUnavailableAction}
          </Button>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-full max-w-[20rem] rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
            <div
              className={`mx-auto aspect-square w-full overflow-hidden rounded-[1rem] bg-slate-50 ${
                disabled ? "pointer-events-none opacity-70" : ""
              }`}
              ref={targetRef}
            />
          </div>
        </div>
      )}

      {currentCharacter ? (
        <div className="rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-600">
          <span className="font-medium text-slate-900">{currentCharacter}</span>
        </div>
      ) : null}
    </div>
  );
}
