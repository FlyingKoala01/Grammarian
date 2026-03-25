import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, PencilLine } from "lucide-react";

import type {
  AppLocale,
  CreateWordResponse,
  SuggestWordDraftRequest,
  SuggestWordDraftResponse,
  StudyWord,
  UpdateWordResponse,
  WordDraft,
  WordValidationResult,
} from "@grammarian/shared";
import { renderPinyinWithToneMarks } from "@grammarian/shared";

import { Button } from "@/components/ui/button";
import { PinyinField } from "@/features/words/PinyinField";
import { useI18n } from "@/lib/i18n";

interface WordManagerProps {
  errorMessage: string | null;
  isSavingWord: boolean;
  onAddWord: (input: WordDraft) => Promise<CreateWordResponse | null>;
  onSuggestWord: (
    input: Partial<WordDraft>,
    mode?: SuggestWordDraftRequest["mode"],
    signal?: AbortSignal,
  ) => Promise<SuggestWordDraftResponse>;
  onUpdateWord: (
    wordId: string,
    input: WordDraft,
  ) => Promise<UpdateWordResponse | null>;
  preferredLanguage: AppLocale;
  words: StudyWord[];
}

function createEmptyDraft(): WordDraft {
  return {
    pinyinCanonical: "",
    simplified: "",
    translation: "",
  };
}

export function WordManager({
  errorMessage,
  isSavingWord,
  onAddWord,
  onSuggestWord,
  onUpdateWord,
  preferredLanguage,
  words,
}: WordManagerProps) {
  const { messages } = useI18n();
  const [draft, setDraft] = useState<WordDraft>(createEmptyDraft);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [isEnrichingSuggestions, setIsEnrichingSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{
    detail: string;
    tone: "neutral" | "success" | "warning";
  } | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [suggestionState, setSuggestionState] =
    useState<SuggestWordDraftResponse | null>(null);
  const skipNextSuggestionRequestRef = useRef(false);
  const suggestionCacheRef = useRef(new Map<string, SuggestWordDraftResponse>());

  const canSaveWord = Boolean(
    draft.simplified.trim() &&
      draft.pinyinCanonical.trim() &&
      draft.translation.trim(),
  );
  const editingWord = useMemo(
    () => words.find((word) => word.id === editingWordId) ?? null,
    [editingWordId, words],
  );

  useEffect(() => {
    suggestionCacheRef.current.clear();
    setIsEnrichingSuggestions(false);
    setIsSuggesting(false);
    setSuggestionError(null);
    setSuggestionState(null);
  }, [preferredLanguage]);

  useEffect(() => {
    const requestDraft = {
      pinyinCanonical: draft.pinyinCanonical.trim(),
      simplified: draft.simplified.trim(),
      translation: draft.translation.trim(),
    };

    if (!shouldRequestSuggestions(requestDraft)) {
      setIsEnrichingSuggestions(false);
      setIsSuggesting(false);
      setSuggestionError(null);
      setSuggestionState(null);
      return;
    }

    if (skipNextSuggestionRequestRef.current) {
      skipNextSuggestionRequestRef.current = false;
      return;
    }

    const suggestionKey = createSuggestionCacheKey(requestDraft);
    const cachedHybrid = suggestionCacheRef.current.get(`${suggestionKey}:hybrid`);

    if (cachedHybrid) {
      setIsEnrichingSuggestions(false);
      setIsSuggesting(false);
      setSuggestionError(null);
      setSuggestionState(cachedHybrid);
      return;
    }

    const cachedDeterministic = suggestionCacheRef.current.get(
      `${suggestionKey}:deterministic`,
    );

    setIsEnrichingSuggestions(false);
    setIsSuggesting(false);
    setSuggestionError(null);
    setSuggestionState(cachedDeterministic ?? null);

    const deterministicController = new AbortController();
    const hybridController = new AbortController();
    const deterministicTimeoutId = window.setTimeout(async () => {
      if (cachedDeterministic) {
        return;
      }

      try {
        setIsSuggesting(true);
        const result = await onSuggestWord(
          requestDraft,
          "deterministic",
          deterministicController.signal,
        );

        if (!deterministicController.signal.aborted) {
          suggestionCacheRef.current.set(`${suggestionKey}:deterministic`, result);

          if (!suggestionCacheRef.current.has(`${suggestionKey}:hybrid`)) {
            setSuggestionError(null);
            setSuggestionState(result);
          }
        }
      } catch (error) {
        if (!deterministicController.signal.aborted) {
          setSuggestionState(null);
          setSuggestionError(
            error instanceof Error
              ? error.message
              : "Suggestions are unavailable right now.",
          );
        }
      } finally {
        if (!deterministicController.signal.aborted) {
          setIsSuggesting(false);
        }
      }
    }, cachedDeterministic ? 0 : 160);

    const hybridTimeoutId = window.setTimeout(async () => {
      if (suggestionCacheRef.current.has(`${suggestionKey}:hybrid`)) {
        return;
      }

      try {
        setIsEnrichingSuggestions(true);
        const result = await onSuggestWord(
          requestDraft,
          "hybrid",
          hybridController.signal,
        );

        if (!hybridController.signal.aborted) {
          suggestionCacheRef.current.set(`${suggestionKey}:deterministic`, result);
          suggestionCacheRef.current.set(`${suggestionKey}:hybrid`, result);
          setSuggestionError(null);
          setSuggestionState(result);
        }
      } catch (error) {
        if (!hybridController.signal.aborted && !cachedDeterministic) {
          setSuggestionError(
            error instanceof Error
              ? error.message
              : "AI suggestions are unavailable right now.",
          );
        }
      } finally {
        if (!hybridController.signal.aborted) {
          setIsEnrichingSuggestions(false);
        }
      }
    }, 650);

    return () => {
      deterministicController.abort();
      hybridController.abort();
      window.clearTimeout(deterministicTimeoutId);
      window.clearTimeout(hybridTimeoutId);
    };
  }, [draft.pinyinCanonical, draft.simplified, draft.translation, onSuggestWord]);

  const canApplySuggestedDraft = useMemo(() => {
    if (!suggestionState) {
      return false;
    }

    return (
      (!draft.simplified.trim() && Boolean(suggestionState.draft.simplified)) ||
      (!draft.pinyinCanonical.trim() &&
        Boolean(suggestionState.draft.pinyinCanonical)) ||
      (!draft.translation.trim() && Boolean(suggestionState.draft.translation))
    );
  }, [draft, suggestionState]);
  const pendingSuggestionFields = useMemo(
    () => getPendingSuggestionFields(draft, messages),
    [draft, messages],
  );
  const isShowingFastSuggestionLoader = isSuggesting && !suggestionState;
  const isShowingAiRefinementLoader =
    isEnrichingSuggestions && (!suggestionState || suggestionState.mode !== "hybrid");

  async function handleSaveWord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const saveResponse = editingWordId
      ? await onUpdateWord(editingWordId, draft)
      : await onAddWord(draft);

    if (!saveResponse) {
      return;
    }

    resetComposer();
    setSaveNotice(buildSaveNotice(saveResponse.validation, messages));
  }

  function updateDraftField(field: keyof WordDraft, value: string) {
    setSaveNotice(null);
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  function acceptFieldSuggestion(field: keyof WordDraft, value: string) {
    skipNextSuggestionRequestRef.current = true;
    setIsEnrichingSuggestions(false);
    setIsSuggesting(false);
    setSaveNotice(null);
    setSuggestionError(null);
    setSuggestionState(null);
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  function applySuggestedDraft() {
    if (!suggestionState) {
      return;
    }

    skipNextSuggestionRequestRef.current = true;
    setIsEnrichingSuggestions(false);
    setIsSuggesting(false);
    setSaveNotice(null);
    setSuggestionError(null);
    setSuggestionState(null);
    setDraft((currentDraft) => ({
      pinyinCanonical:
        currentDraft.pinyinCanonical.trim() ||
        suggestionState.draft.pinyinCanonical,
      simplified: currentDraft.simplified.trim() || suggestionState.draft.simplified,
      translation:
        currentDraft.translation.trim() || suggestionState.draft.translation,
    }));
  }

  function startEditingWord(word: StudyWord) {
    skipNextSuggestionRequestRef.current = true;
    setEditingWordId(word.id);
    setIsEnrichingSuggestions(false);
    setIsSuggesting(false);
    setSaveNotice(null);
    setSuggestionError(null);
    setSuggestionState(null);
    setDraft({
      pinyinCanonical: word.pinyinCanonical,
      simplified: word.simplified,
      translation: word.translation,
    });
  }

  function resetComposer() {
    skipNextSuggestionRequestRef.current = true;
    setDraft(createEmptyDraft());
    setEditingWordId(null);
    setIsEnrichingSuggestions(false);
    setIsSuggesting(false);
    setSuggestionError(null);
    setSuggestionState(null);
  }

  return (
    <section className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <form
        className="min-h-0 rounded-[1.5rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_22px_65px_rgba(0,0,0,0.34)] xl:flex xl:flex-col xl:p-8"
        onSubmit={handleSaveWord}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
          <div>
            <p className="text-sm text-slate-600 dark:text-stone-300">
              {editingWord ? messages.editWordHelp : messages.saveWordHelp}
            </p>
            {editingWord ? (
              <p className="mt-2 text-sm font-medium text-slate-900 dark:text-stone-100">
                {messages.editingWord(editingWord.simplified)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge>
              {isShowingFastSuggestionLoader
                ? messages.fastSuggestionsLoading
                : isShowingAiRefinementLoader
                  ? messages.preparingAiDraft
                  : suggestionState?.mode === "hybrid" || suggestionState?.model
                    ? `AI: ${suggestionState.model ?? "refined"}`
                    : suggestionState
                      ? messages.fastSuggestions
                      : messages.idleSuggestions}
            </StatusBadge>
            {canApplySuggestedDraft ? (
              <Button
                className="rounded-xl"
                onClick={applySuggestedDraft}
                type="button"
                variant="outline"
              >
                {messages.fillMissing}
              </Button>
            ) : null}
            {editingWord ? (
              <Button
                className="rounded-xl"
                onClick={resetComposer}
                type="button"
                variant="ghost"
              >
                {messages.cancelEdit}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <FieldBlock
            disabled={isSavingWord}
            label={messages.fieldHanzi}
            onApplySuggestion={(value) => acceptFieldSuggestion("simplified", value)}
            onChange={(value) => updateDraftField("simplified", value)}
            placeholder={getFieldPlaceholder(
              "simplified",
              draft,
              suggestionState,
              messages.hanziPlaceholder,
            )}
            suggestions={getFieldSuggestions("simplified", draft, suggestionState)}
            value={draft.simplified}
          />

          <FieldBlock
            disabled={isSavingWord}
            label={messages.fieldMeaning}
            onApplySuggestion={(value) => acceptFieldSuggestion("translation", value)}
            onChange={(value) => updateDraftField("translation", value)}
            placeholder={getFieldPlaceholder(
              "translation",
              draft,
              suggestionState,
              messages.translationPlaceholder,
            )}
            suggestions={getFieldSuggestions("translation", draft, suggestionState)}
            value={draft.translation}
          />
        </div>

        <div className="mt-5">
          <PinyinField
            disabled={isSavingWord}
            label={messages.fieldPinyin}
            onApplySuggestion={(value) =>
              acceptFieldSuggestion("pinyinCanonical", value)
            }
            onChange={(value) => updateDraftField("pinyinCanonical", value)}
            placeholder={getFieldPlaceholder(
              "pinyinCanonical",
              draft,
              suggestionState,
              messages.pinyinPlaceholder,
            )}
            suggestions={getFieldSuggestions("pinyinCanonical", draft, suggestionState)}
            value={draft.pinyinCanonical}
          />
        </div>

        {isShowingFastSuggestionLoader || isShowingAiRefinementLoader ? (
          <div className="mt-5 flex items-start gap-3 rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
            <div>
              <p className="font-medium">
                {isShowingFastSuggestionLoader
                  ? messages.fastSuggestionsLoading
                  : messages.preparingAiDraft}
              </p>
              <p className="mt-1 text-amber-800">
                {isShowingFastSuggestionLoader
                  ? messages.fastSuggestionsMessage
                  : messages.preparingAiDraftMessage(
                      pendingSuggestionFields.length > 0
                        ? pendingSuggestionFields.join(", ").toLowerCase()
                        : "",
                    )}
              </p>
            </div>
          </div>
        ) : null}

        {suggestionError ? (
          <div className="mt-4 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
            {suggestionError}
          </div>
        ) : null}

        {saveNotice ? (
          <div
            className={`mt-4 rounded-[1.2rem] border px-4 py-3 text-sm leading-6 ${
              saveNotice.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-500/12 dark:text-emerald-200"
                : saveNotice.tone === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-200"
                  : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-stone-300"
            }`}
          >
            {saveNotice.detail}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700 dark:border-rose-500/35 dark:bg-rose-500/12 dark:text-rose-200">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col items-start gap-4 border-t border-slate-200 pt-6 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-stone-400">{messages.startTypingHelp}</p>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {editingWord ? (
              <Button
                className="rounded-xl"
                onClick={resetComposer}
                type="button"
                variant="ghost"
              >
                {messages.cancel}
              </Button>
            ) : null}
            <Button
              className="rounded-xl"
              disabled={!canSaveWord || isSavingWord}
              type="submit"
            >
              {isSavingWord
                ? editingWord
                  ? messages.saveChangesProgress
                  : messages.saveWordProgress
                : editingWord
                  ? messages.saveChanges
                  : messages.saveWord}
            </Button>
          </div>
        </div>
      </form>

      <aside className="min-h-0 rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_22px_65px_rgba(0,0,0,0.34)] xl:flex xl:flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-2 pb-4 dark:border-white/10">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-stone-300">{messages.savedWords}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-950 dark:text-stone-50">{words.length}</p>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          {words.length === 0 ? (
            <div className="flex h-full min-h-[220px] items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-5 text-center text-sm leading-7 text-slate-600 dark:border-white/14 dark:bg-white/5 dark:text-stone-300">
              {messages.emptyDictionary}
            </div>
          ) : (
            <div className="space-y-3">
              {words.map((word) => {
                const toneMarkedPinyin = renderPinyinWithToneMarks(
                  word.pinyinCanonical,
                );

                return (
                  <article
                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50/85 px-4 py-4 dark:border-white/10 dark:bg-white/5"
                    key={word.id}
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <p className="text-3xl font-semibold text-slate-950 dark:text-stone-50">
                        {word.simplified}
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-700 dark:text-stone-200">
                      {toneMarkedPinyin || word.pinyinCanonical}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-amber-800">
                      {word.translation}
                    </p>
                    <div className="mt-4 flex justify-end">
                      <Button
                        className="rounded-xl"
                        onClick={() => startEditingWord(word)}
                        type="button"
                        variant="outline"
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        {messages.edit}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}

function FieldBlock({
  disabled,
  label,
  onApplySuggestion,
  onChange,
  placeholder,
  suggestions,
  value,
}: {
  disabled?: boolean;
  label: string;
  onApplySuggestion: (value: string) => void;
  onChange: (value: string) => void;
  placeholder: string;
  suggestions: string[];
  value: string;
}) {
  return (
    <div className="space-y-3">
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-stone-300">
        {label}
        <input
          className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-amber-500 dark:border-white/12 dark:bg-white/6 dark:text-stone-100 dark:placeholder:text-stone-500"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      </label>

      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition hover:border-amber-500 hover:text-amber-800 dark:border-white/10 dark:bg-white/6 dark:text-stone-200 dark:hover:border-amber-400 dark:hover:text-amber-300"
              key={suggestion}
              onClick={() => onApplySuggestion(suggestion)}
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

function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-stone-300">
      {children}
    </span>
  );
}

function shouldRequestSuggestions(draft: Partial<WordDraft>) {
  const hasAnyInput = Boolean(
    draft.simplified?.trim() ||
      draft.pinyinCanonical?.trim() ||
      draft.translation?.trim(),
  );
  const hasMissingFields =
    !draft.simplified?.trim() ||
    !draft.pinyinCanonical?.trim() ||
    !draft.translation?.trim();
  const hasEnoughSignal =
    (draft.simplified?.trim().length ?? 0) >= 1 ||
    (draft.pinyinCanonical?.trim().length ?? 0) >= 2 ||
    (draft.translation?.trim().length ?? 0) >= 2;

  return hasAnyInput && hasMissingFields && hasEnoughSignal;
}

function getFieldPlaceholder(
  field: keyof WordDraft,
  draft: WordDraft,
  suggestionState: SuggestWordDraftResponse | null,
  fallback: string,
) {
  if (draft[field].trim()) {
    return fallback;
  }

  return (
    suggestionState?.suggestions[field][0] ||
    suggestionState?.draft[field] ||
    fallback
  );
}

function getFieldSuggestions(
  field: keyof WordDraft,
  draft: WordDraft,
  suggestionState: SuggestWordDraftResponse | null,
) {
  if (!suggestionState) {
    return [];
  }

  return suggestionState.suggestions[field].filter(
    (suggestion) => suggestion && suggestion !== draft[field].trim(),
  );
}

function getPendingSuggestionFields(
  draft: WordDraft,
  messages: {
    fieldHanzi: string;
    fieldMeaning: string;
    fieldPinyin: string;
  },
) {
  const fields: string[] = [];

  if (!draft.simplified.trim()) {
    fields.push(messages.fieldHanzi);
  }

  if (!draft.pinyinCanonical.trim()) {
    fields.push(messages.fieldPinyin);
  }

  if (!draft.translation.trim()) {
    fields.push(messages.fieldMeaning);
  }

  return fields;
}

function createSuggestionCacheKey(draft: Partial<WordDraft>) {
  return [
    normalizeSuggestionKeyValue(draft.simplified),
    normalizeSuggestionKeyValue(draft.pinyinCanonical),
    normalizeSuggestionKeyValue(draft.translation),
  ].join("::");
}

function normalizeSuggestionKeyValue(value?: string) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function buildSaveNotice(
  validation: WordValidationResult,
  messages: {
    fieldHanzi: string;
    fieldMeaning: string;
    fieldPinyin: string;
    saveUnverified: string;
    saveVerified: string;
    saveWithCorrections: (fields: string) => string;
  },
) {
  const correctedFieldsLabel = validation.correctedFields
    .map((field) =>
      field === "simplified"
        ? messages.fieldHanzi.toLowerCase()
        : field === "pinyinCanonical"
          ? messages.fieldPinyin.toLowerCase()
          : messages.fieldMeaning.toLowerCase(),
    )
    .join(", ");

  if (validation.status === "corrected") {
    return {
      detail: messages.saveWithCorrections(correctedFieldsLabel),
      tone: "warning" as const,
    };
  }

  if (validation.status === "verified") {
    return {
      detail: messages.saveVerified,
      tone: "success" as const,
    };
  }

  return {
    detail: messages.saveUnverified,
    tone: "neutral" as const,
  };
}
