import { useMemo, useRef, useState } from "react";

import {
  getToneSuggestionTarget,
  hasPinyinToneInformation,
  renderPinyinWithToneMarks,
} from "@grammarian/shared";

import { useI18n } from "@/lib/i18n";

interface PinyinFieldProps {
  disabled?: boolean;
  helperTitle?: string;
  label: string;
  onApplySuggestion?: (value: string) => void;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  value: string;
}

export function PinyinField({
  disabled,
  helperTitle,
  label,
  onApplySuggestion,
  onChange,
  placeholder,
  suggestions = [],
  value,
}: PinyinFieldProps) {
  const { messages } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectionStart, setSelectionStart] = useState(value.length);
  const tonePreview = renderPinyinWithToneMarks(value);
  const resolvedHelperTitle = helperTitle ?? messages.toneSuggestions;

  const toneSuggestionState = useMemo(() => {
    const syllableRange = findCurrentSyllableRange(value, selectionStart);

    if (!syllableRange) {
      return null;
    }

    const rawSyllable = value.slice(syllableRange.start, syllableRange.end);

    if (!rawSyllable || hasPinyinToneInformation(rawSyllable)) {
      return null;
    }

    const target = getToneSuggestionTarget(rawSyllable);

    if (!target) {
      return null;
    }

    return {
      ...target,
      range: syllableRange,
    };
  }, [selectionStart, value]);

  const visibleSuggestions = suggestions.filter(
    (suggestion) => suggestion && suggestion !== tonePreview && suggestion !== value,
  );

  function syncSelection(eventTarget: HTMLInputElement) {
    setSelectionStart(eventTarget.selectionStart ?? eventTarget.value.length);
  }

  function applyToneSuggestion(tone: string) {
    if (!toneSuggestionState) {
      return;
    }

    const replacement = renderPinyinWithToneMarks(
      `${toneSuggestionState.syllable}${tone}`,
    );
    const nextValue = `${value.slice(0, toneSuggestionState.range.start)}${replacement}${value.slice(
      toneSuggestionState.range.end,
    )}`;

    onChange(nextValue);

    window.requestAnimationFrame(() => {
      const input = inputRef.current;

      if (!input) {
        return;
      }

      const nextSelection = toneSuggestionState.range.start + replacement.length;
      input.focus();
      input.setSelectionRange(nextSelection, nextSelection);
      setSelectionStart(nextSelection);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-stone-300">
        {label}
        <div className="relative">
          {isFocused && toneSuggestionState ? (
            <div className="absolute inset-x-0 top-0 z-10 flex -translate-y-[calc(100%+0.5rem)] flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:border-white/12 dark:bg-[#1d1713] dark:shadow-[0_18px_40px_rgba(0,0,0,0.38)] sm:left-4 sm:right-auto sm:w-auto">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-stone-400">
                {resolvedHelperTitle}
              </span>
              <div className="flex flex-wrap gap-1">
                {toneSuggestionState.options.map((option, index) => (
                  <button
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm text-slate-700 transition hover:border-amber-500 hover:text-amber-800 dark:border-white/10 dark:bg-white/6 dark:text-stone-200 dark:hover:border-amber-400 dark:hover:text-amber-300"
                    disabled={disabled}
                    key={`${option}-${index}`}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      applyToneSuggestion(String(index + 1));
                    }}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <input
            className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-amber-500 dark:border-white/12 dark:bg-white/6 dark:text-stone-100 dark:placeholder:text-stone-500"
            disabled={disabled}
            onBlur={() => setIsFocused(false)}
            onChange={(event) => {
              onChange(event.target.value);
              syncSelection(event.target);
            }}
            onClick={(event) => syncSelection(event.currentTarget)}
            onFocus={(event) => {
              setIsFocused(true);
              syncSelection(event.currentTarget);
            }}
            onKeyUp={(event) => syncSelection(event.currentTarget)}
            onSelect={(event) => syncSelection(event.currentTarget)}
            placeholder={placeholder}
            ref={inputRef}
            value={value}
          />
        </div>
      </label>

      {visibleSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {visibleSuggestions.map((suggestion) => (
            <button
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition hover:border-amber-500 hover:text-amber-800 dark:border-white/10 dark:bg-white/6 dark:text-stone-200 dark:hover:border-amber-400 dark:hover:text-amber-300"
              disabled={disabled}
              key={suggestion}
              onClick={() => onApplySuggestion?.(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function findCurrentSyllableRange(value: string, cursorIndex: number) {
  if (!value) {
    return null;
  }

  let start = cursorIndex;
  let end = cursorIndex;

  while (start > 0 && isPinyinTokenCharacter(value[start - 1] ?? "")) {
    start -= 1;
  }

  while (end < value.length && isPinyinTokenCharacter(value[end] ?? "")) {
    end += 1;
  }

  if (start === end) {
    return null;
  }

  return { end, start };
}

function isPinyinTokenCharacter(character: string) {
  return /[a-zA-Z\u00fc\u0101\u00e1\u01ce\u00e0\u0113\u00e9\u011b\u00e8\u012b\u00ed\u01d0\u00ec\u014d\u00f3\u01d2\u00f2\u016b\u00fa\u01d4\u00f9\u01d6\u01d8\u01da\u01dc0-5:]/.test(
    character,
  );
}
