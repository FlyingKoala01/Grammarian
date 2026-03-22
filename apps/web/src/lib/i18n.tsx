import { createContext, useContext, useEffect, type PropsWithChildren } from "react";

import type { AppLocale } from "@grammarian/shared";
import { defaultAppLocale } from "@grammarian/shared";

export interface AppMessages {
  appDescription: string;
  answerHelper: string;
  answerWith: string;
  cancel: string;
  cancelEdit: string;
  checkAnswer: string;
  checkingAnswer: string;
  continue: string;
  demoLoginFootnote: string;
  demoLoginHelp: string;
  dictionary: string;
  dueNow: string;
  dueNowCount: (count: number) => string;
  edit: string;
  editingWord: (word: string) => string;
  editWordHelp: string;
  emptyDictionary: string;
  exerciseEmpty: string;
  exerciseHint: string;
  exerciseImplementationStatus: string;
  exerciseImplementedInfo: string;
  exerciseLoading: string;
  exercises: string;
  exerciseOptionCharacterRecognitionDescription: string;
  exerciseOptionCharacterRecognitionLabel: string;
  exerciseOptionCharacterWritingDescription: string;
  exerciseOptionCharacterWritingLabel: string;
  exerciseOptionGapFillDescription: string;
  exerciseOptionGapFillLabel: string;
  exerciseOptionGapFillUnavailableMessage: string;
  exerciseOptionPinyinRecognitionDescription: string;
  exerciseOptionPinyinRecognitionLabel: string;
  exerciseOptionSentenceUnderstandingDescription: string;
  exerciseOptionSentenceUnderstandingLabel: string;
  exerciseOptionSentenceUnderstandingUnavailableMessage: string;
  exerciseStatusAvailable: string;
  exerciseStatusPlanned: string;
  expected: string;
  fastSuggestions: string;
  fastSuggestionsLoading: string;
  fastSuggestionsMessage: string;
  fieldHanzi: string;
  fieldMeaning: string;
  fieldPinyin: string;
  fillMissing: string;
  hanziPlaceholder: string;
  idleSuggestions: string;
  language: string;
  languageHelp: string;
  learnerName: string;
  learnerNamePlaceholder: string;
  loadExercise: string;
  logOut: string;
  meaning: string;
  next: string;
  nextExercise: string;
  nextReview: (date: string) => string;
  nextReviewShort: (date: string) => string;
  noAnswerRecorded: string;
  noReviewsScheduled: string;
  nothingDue: string;
  pinyinAnswerHint: string;
  pinyinExerciseHint: (initials: string, syllableCount: number) => string;
  pinyinPlaceholder: string;
  placeholder: string;
  preparingAiDraft: string;
  preparingAiDraftMessage: (fields: string) => string;
  queueClear: string;
  readyForReview: string;
  restoringSession: string;
  reviewDueDetail: (count: number) => string;
  reviewNothingDue: string;
  reviewQueue: string;
  reviewScheduled: string;
  retryExercise: string;
  recognitionExerciseHint: (initials: string, wordCount: number) => string;
  saveChanges: string;
  saveChangesProgress: string;
  savedWords: string;
  saveUnverified: string;
  saveVerified: string;
  saveWithCorrections: (fields: string) => string;
  saveWord: string;
  saveWordHelp: string;
  saveWordProgress: string;
  sessionTitle: string;
  startingSession: string;
  startTypingHelp: string;
  traceAnswerWith: string;
  traceComplete: string;
  traceDrawingUnavailable: string;
  traceDrawingUnavailableAction: string;
  traceInstructions: string;
  traceStrokeHint: (strokeNumber: number) => string;
  traceLoading: string;
  traceMistakes: (count: number) => string;
  traceProgress: (current: number, total: number) => string;
  traceRestart: string;
  traceStatusReady: string;
  toneSuggestions: string;
  translationPlaceholder: string;
  writingExerciseHint: (
    characterCount: number,
    firstCharacter: string,
    pinyin: string,
  ) => string;
  wordsCount: (count: number) => string;
  wordsSummary: (count: number) => string;
  yourAnswer: string;
}

const messagesByLocale: Record<AppLocale, AppMessages> = {
  en: {
    appDescription:
      "A simple Chinese study workspace for building your dictionary and reviewing it over time.",
    answerHelper: "Answer helper",
    answerWith: "Answer with",
    cancel: "Cancel",
    cancelEdit: "Cancel edit",
    checkAnswer: "Check answer",
    checkingAnswer: "Checking...",
    continue: "Continue",
    demoLoginFootnote: "One learner name maps to one personal study set.",
    demoLoginHelp: "Use the same name later to return to the same study set.",
    dictionary: "Dictionary",
    dueNow: "Due now",
    dueNowCount: (count) => `${count} due now`,
    edit: "Edit",
    editingWord: (word) => `Editing ${word}`,
    editWordHelp:
      "Edit the saved word. AI will verify the hanzi, pinyin, and meaning again when you save.",
    emptyDictionary:
      "Start typing a word entry and save it when the fields look right.",
    exerciseEmpty:
      "Add words in the dictionary first, then come back here to practice.",
    exerciseHint: "Hint",
    exerciseImplementationStatus: "Implementation status",
    exerciseImplementedInfo:
      "This exercise family is wired to the current word-based practice engine.",
    exerciseLoading: "Building the next exercise...",
    exercises: "Exercises",
    exerciseOptionCharacterRecognitionDescription:
      "Recognize hanzi or words and answer with the stored meaning.",
    exerciseOptionCharacterRecognitionLabel: "Character Recognition",
    exerciseOptionCharacterWritingDescription:
      "Produce the correct hanzi from the meaning or reading, with tracing when the saved word can be drawn character by character.",
    exerciseOptionCharacterWritingLabel: "Character Writing",
    exerciseOptionGapFillDescription:
      "Complete a sentence by supplying the missing word or structure.",
    exerciseOptionGapFillLabel: "Gap Fill",
    exerciseOptionGapFillUnavailableMessage:
      "Gap-fill is part of the documented plan, but it still needs sentence content and a dedicated generator.",
    exerciseOptionPinyinRecognitionDescription:
      "Connect hanzi to pronunciation by writing the correct pinyin.",
    exerciseOptionPinyinRecognitionLabel: "Pinyin Recognition",
    exerciseOptionSentenceUnderstandingDescription:
      "Work on sentence meaning, grammar, and interpretation in context.",
    exerciseOptionSentenceUnderstandingLabel: "Sentence Understanding",
    exerciseOptionSentenceUnderstandingUnavailableMessage:
      "Sentence understanding is part of the documented plan, but it still needs sentence items and contextual grading.",
    exerciseStatusAvailable: "Available",
    exerciseStatusPlanned: "Planned",
    expected: "Expected",
    fastSuggestions: "Fast suggestions",
    fastSuggestionsLoading: "Fast suggestions...",
    fastSuggestionsMessage:
      "Normalizing what you typed before the AI pass starts.",
    fieldHanzi: "Hanzi",
    fieldMeaning: "Translation",
    fieldPinyin: "Pinyin",
    fillMissing: "Fill missing",
    hanziPlaceholder: "e.g. 学习",
    idleSuggestions: "Suggestions idle",
    language: "Language",
    languageHelp: "For now, the app is translated only in English and Italian.",
    learnerName: "Learner name",
    learnerNamePlaceholder: "e.g. Isaac",
    loadExercise: "Load exercise",
    logOut: "Log out",
    meaning: "Meaning",
    next: "Next",
    nextExercise: "Next exercise",
    nextReview: (date) => `Next review ${date}`,
    nextReviewShort: (date) => `Next ${date}`,
    noAnswerRecorded: "No answer recorded",
    noReviewsScheduled: "No reviews scheduled yet",
    nothingDue: "Nothing due",
    pinyinAnswerHint: "Tone marks and tone numbers are both accepted.",
    pinyinExerciseHint: (initials, syllableCount) =>
      `Hint: ${syllableCount} syllable${syllableCount === 1 ? "" : "s"}. It starts like ${initials}.`,
    pinyinPlaceholder: "Type pinyin",
    placeholder: "Placeholder",
    preparingAiDraft: "AI is refining the word draft.",
    preparingAiDraftMessage: (fields) =>
      `Trying to suggest ${fields || "the missing fields"}.`,
    queueClear: "Queue clear",
    readyForReview: "Ready for review",
    restoringSession: "Restoring your study session...",
    reviewDueDetail: (count) =>
      `${count} word${count === 1 ? "" : "s"} due for review now.`,
    reviewNothingDue: "No review items are due yet.",
    reviewQueue: "Review queue",
    reviewScheduled: "Scheduled",
    recognitionExerciseHint: (initials, wordCount) =>
      `Hint: ${wordCount} word${wordCount === 1 ? "" : "s"}. It starts like ${initials}.`,
    retryExercise: "Try again",
    saveChanges: "Save changes",
    saveChangesProgress: "Saving changes...",
    savedWords: "Saved words",
    saveUnverified: "Saved without AI verification.",
    saveVerified: "Saved and AI-verified.",
    saveWithCorrections: (fields) =>
      fields
        ? `Saved with AI corrections to ${fields}.`
        : "Saved with AI corrections.",
    saveWord: "Save word",
    saveWordHelp:
      "Type Hanzi, pinyin, or a meaning. Missing fields will be suggested.",
    saveWordProgress: "Saving...",
    sessionTitle: "Continue with learner name",
    startingSession: "Starting session...",
    startTypingHelp:
      "AI checks saved words, but you still control the final entry.",
    traceAnswerWith: "Trace the character",
    traceComplete: "Trace complete. Ready to submit.",
    traceDrawingUnavailable:
      "The tracing canvas could not load for this word. You can type the answer instead.",
    traceDrawingUnavailableAction: "Type instead",
    traceInstructions:
      "Trace each character stroke by stroke inside the guide. After two misses on the same stroke, the correct order is shown.",
    traceStrokeHint: (strokeNumber) =>
      `Hint shown: watch stroke ${strokeNumber} in orange, then try it again.`,
    traceLoading: "Loading tracing canvas...",
    traceMistakes: (count) =>
      `${count} mistake${count === 1 ? "" : "s"} in this attempt`,
    traceProgress: (current, total) => `Character ${current} of ${total}`,
    traceRestart: "Restart trace",
    traceStatusReady: "Trace the character",
    toneSuggestions: "Tone suggestions",
    translationPlaceholder: "e.g. to study",
    writingExerciseHint: (characterCount, firstCharacter, pinyin) =>
      `Hint: ${characterCount} character${characterCount === 1 ? "" : "s"}. It starts with ${firstCharacter}. Pinyin: ${pinyin}.`,
    wordsCount: (count) => `${count} word${count === 1 ? "" : "s"}`,
    wordsSummary: (count) => `${count} ${count === 1 ? "word" : "words"}`,
    yourAnswer: "Your answer",
  },
  it: {
    appDescription:
      "Uno spazio semplice per studiare cinese, costruire il tuo dizionario e ripassarlo nel tempo.",
    answerHelper: "Aiuto risposta",
    answerWith: "Rispondi con",
    cancel: "Annulla",
    cancelEdit: "Annulla modifica",
    checkAnswer: "Controlla risposta",
    checkingAnswer: "Controllo...",
    continue: "Continua",
    demoLoginFootnote: "Un nome studente corrisponde a un solo set personale.",
    demoLoginHelp:
      "Usa lo stesso nome piu tardi per tornare allo stesso set di studio.",
    dictionary: "Dizionario",
    dueNow: "Da ripassare",
    dueNowCount: (count) => `${count} da ripassare`,
    edit: "Modifica",
    editingWord: (word) => `Modifica di ${word}`,
    editWordHelp:
      "Modifica la parola salvata. Quando salvi, l'IA ricontrollera hanzi, pinyin e significato.",
    emptyDictionary:
      "Inizia a digitare una parola e salvala quando i campi ti sembrano corretti.",
    exerciseEmpty:
      "Aggiungi prima parole nel dizionario, poi torna qui per esercitarti.",
    exerciseHint: "Suggerimento",
    exerciseImplementationStatus: "Stato di implementazione",
    exerciseImplementedInfo:
      "Questa famiglia di esercizi e gia collegata all'attuale motore di pratica basato sulle parole.",
    exerciseLoading: "Preparazione del prossimo esercizio...",
    exercises: "Esercizi",
    exerciseOptionCharacterRecognitionDescription:
      "Riconosci hanzi o parole e rispondi con il significato salvato.",
    exerciseOptionCharacterRecognitionLabel: "Riconoscimento dei caratteri",
    exerciseOptionCharacterWritingDescription:
      "Produci l'hanzi corretto dal significato o dalla lettura, con tracciamento quando la parola salvata puo essere disegnata carattere per carattere.",
    exerciseOptionCharacterWritingLabel: "Scrittura dei caratteri",
    exerciseOptionGapFillDescription:
      "Completa una frase inserendo la parola o la struttura mancante.",
    exerciseOptionGapFillLabel: "Riempi gli spazi",
    exerciseOptionGapFillUnavailableMessage:
      "Il riempimento degli spazi fa parte del piano, ma richiede ancora contenuti di frasi e un generatore dedicato.",
    exerciseOptionPinyinRecognitionDescription:
      "Collega gli hanzi alla pronuncia scrivendo il pinyin corretto.",
    exerciseOptionPinyinRecognitionLabel: "Riconoscimento del pinyin",
    exerciseOptionSentenceUnderstandingDescription:
      "Lavora su significato, grammatica e interpretazione della frase nel contesto.",
    exerciseOptionSentenceUnderstandingLabel: "Comprensione della frase",
    exerciseOptionSentenceUnderstandingUnavailableMessage:
      "La comprensione della frase fa parte del piano, ma richiede ancora frasi salvate e una valutazione contestuale.",
    exerciseStatusAvailable: "Disponibile",
    exerciseStatusPlanned: "Pianificato",
    expected: "Atteso",
    fastSuggestions: "Suggerimenti rapidi",
    fastSuggestionsLoading: "Suggerimenti rapidi...",
    fastSuggestionsMessage:
      "Sto normalizzando cio che hai scritto prima del passaggio IA.",
    fieldHanzi: "Hanzi",
    fieldMeaning: "Traduzione",
    fieldPinyin: "Pinyin",
    fillMissing: "Completa mancanti",
    hanziPlaceholder: "es. 学习",
    idleSuggestions: "Suggerimenti inattivi",
    language: "Lingua",
    languageHelp: "Per ora l'app e tradotta solo in inglese e italiano.",
    learnerName: "Nome studente",
    learnerNamePlaceholder: "es. Isaac",
    loadExercise: "Carica esercizio",
    logOut: "Esci",
    meaning: "Significato",
    next: "Avanti",
    nextExercise: "Prossimo esercizio",
    nextReview: (date) => `Prossimo ripasso ${date}`,
    nextReviewShort: (date) => `Prossimo ${date}`,
    noAnswerRecorded: "Nessuna risposta registrata",
    noReviewsScheduled: "Nessun ripasso programmato per ora",
    nothingDue: "Nulla in scadenza",
    pinyinAnswerHint: "Sono accettati sia i toni numerici sia gli accenti.",
    pinyinExerciseHint: (initials, syllableCount) =>
      `Suggerimento: ${syllableCount} sillab${syllableCount === 1 ? "a" : "e"}. Inizia come ${initials}.`,
    pinyinPlaceholder: "Scrivi pinyin",
    placeholder: "Segnaposto",
    preparingAiDraft: "L'IA sta rifinendo la scheda della parola.",
    preparingAiDraftMessage: (fields) =>
      `Sto cercando di suggerire ${fields || "i campi mancanti"}.`,
    queueClear: "Coda vuota",
    readyForReview: "Pronto per il ripasso",
    restoringSession: "Ripristino della tua sessione di studio...",
    reviewDueDetail: (count) =>
      `${count} parola${count === 1 ? "" : "e"} da ripassare adesso.`,
    reviewNothingDue: "Nessun elemento e ancora da ripassare.",
    reviewQueue: "Coda di ripasso",
    reviewScheduled: "Programmato",
    recognitionExerciseHint: (initials, wordCount) =>
      `Suggerimento: ${wordCount} parol${wordCount === 1 ? "a" : "e"}. Inizia come ${initials}.`,
    retryExercise: "Riprova",
    saveChanges: "Salva modifiche",
    saveChangesProgress: "Salvataggio modifiche...",
    savedWords: "Parole salvate",
    saveUnverified: "Salvato senza verifica IA.",
    saveVerified: "Salvato e verificato dall'IA.",
    saveWithCorrections: (fields) =>
      fields
        ? `Salvato con correzioni IA su ${fields}.`
        : "Salvato con correzioni IA.",
    saveWord: "Salva parola",
    saveWordHelp:
      "Scrivi hanzi, pinyin o un significato. I campi mancanti verranno suggeriti.",
    saveWordProgress: "Salvataggio...",
    sessionTitle: "Continua con il nome studente",
    startingSession: "Avvio sessione...",
    startTypingHelp:
      "L'IA controlla le parole salvate, ma l'ultima decisione resta tua.",
    traceAnswerWith: "Traccia il carattere",
    traceComplete: "Tracciamento completato. Pronto per l'invio.",
    traceDrawingUnavailable:
      "Il canvas di tracciamento non e disponibile per questa parola. Puoi scrivere la risposta.",
    traceDrawingUnavailableAction: "Scrivi invece",
    traceInstructions:
      "Traccia ogni carattere tratto per tratto dentro la guida. Dopo due errori sullo stesso tratto, viene mostrato l'ordine corretto.",
    traceStrokeHint: (strokeNumber) =>
      `Suggerimento mostrato: guarda il tratto ${strokeNumber} in arancione e poi riprova.`,
    traceLoading: "Caricamento del canvas di tracciamento...",
    traceMistakes: (count) =>
      `${count} error${count === 1 ? "e" : "i"} in questo tentativo`,
    traceProgress: (current, total) => `Carattere ${current} di ${total}`,
    traceRestart: "Ricomincia",
    traceStatusReady: "Traccia il carattere",
    toneSuggestions: "Suggerimenti di tono",
    translationPlaceholder: "es. studiare",
    writingExerciseHint: (characterCount, firstCharacter, pinyin) =>
      `Suggerimento: ${characterCount} caratter${characterCount === 1 ? "e" : "i"}. Inizia con ${firstCharacter}. Pinyin: ${pinyin}.`,
    wordsCount: (count) => `${count} parola${count === 1 ? "" : "e"}`,
    wordsSummary: (count) => `${count} parola${count === 1 ? "" : "e"}`,
    yourAnswer: "La tua risposta",
  },
};

interface I18nContextValue {
  formatDateTime: (value: string) => string;
  locale: AppLocale;
  messages: AppMessages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function getMessagesForLocale(locale: AppLocale) {
  return messagesByLocale[locale] ?? messagesByLocale[defaultAppLocale];
}

export function I18nProvider({
  children,
  locale,
}: PropsWithChildren<{ locale: AppLocale }>) {
  const messages = getMessagesForLocale(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nContext.Provider
      value={{
        formatDateTime: (value: string) =>
          new Intl.DateTimeFormat(locale, {
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            month: "short",
          }).format(new Date(value)),
        locale,
        messages,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside an I18nProvider.");
  }

  return context;
}
