import type {
  AppLocale,
  DocumentedExerciseType,
  ExerciseResultWord,
  SupportedWordExerciseType,
  StudyProgressSummary,
  StudyWord,
  WordExercise,
  WordExerciseKind,
} from "@grammarian/shared";
import {
  isSupportedWordExerciseType,
  normalizePinyinForComparison,
  parseTraceCompletedAnswer,
} from "@grammarian/shared";

import { AppError } from "../errors/app-error.js";
import {
  getNextScheduledReviewAt,
  isWordReviewDue,
  type StoredWordReviewSchedule,
} from "./word-review.js";
import {
  normalizeStoredChinese,
  normalizeStoredTranslation,
} from "./word-intake.js";

interface StoredExerciseAttempt {
  answer: string;
  createdAt: string;
  exerciseId: string;
  id: string;
  isCorrect: boolean;
  kind: WordExerciseKind;
  normalizedAnswer: string;
  userId: string;
  wordId: string;
}

const exerciseKinds: WordExerciseKind[] = ["recognition", "writing", "pinyin"];

export function buildStudyProgressSummary(
  words: StudyWord[],
  attempts: StoredExerciseAttempt[],
  reviewSchedules: StoredWordReviewSchedule[],
): StudyProgressSummary {
  const correctAttempts = attempts.filter((attempt) => attempt.isCorrect).length;
  const dueReviewCount = reviewSchedules.filter((schedule) =>
    isWordReviewDue(schedule),
  ).length;

  return {
    correctAttempts,
    dueReviewCount,
    incorrectAttempts: attempts.length - correctAttempts,
    nextReviewAt: getNextScheduledReviewAt(reviewSchedules),
    totalAttempts: attempts.length,
    totalWords: words.length,
  };
}

export function buildNextWordExercise(
  words: StudyWord[],
  attempts: StoredExerciseAttempt[],
  reviewSchedules: StoredWordReviewSchedule[],
  locale: AppLocale,
  requestedExerciseType?: DocumentedExerciseType,
): WordExercise {
  if (words.length === 0) {
    throw new AppError(400, "Add at least one word before starting exercises.");
  }

  if (requestedExerciseType && !isSupportedWordExerciseType(requestedExerciseType)) {
    throw new AppError(400, getUnsupportedExerciseTypeMessage(requestedExerciseType));
  }

  const referenceTime = new Date();
  const scheduleByWordId = new Map(
    reviewSchedules.map((schedule) => [schedule.wordId, schedule]),
  );
  const sortedWords = [...words].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
  const dueWords = sortedWords
    .filter((word) => {
      const schedule = scheduleByWordId.get(word.id);

      return schedule ? isWordReviewDue(schedule, referenceTime) : true;
    })
    .sort((left, right) =>
      compareScheduledWords(left, right, attempts, scheduleByWordId),
    );
  const candidateWords =
    dueWords.length > 0
      ? dueWords
      : sortedWords.sort((left, right) =>
          compareScheduledWords(left, right, attempts, scheduleByWordId),
        );
  const targetWord = candidateWords[0];

  if (!targetWord) {
    throw new AppError(500, "Could not choose a target word for the exercise.");
  }

  const targetAttemptCount = attempts.filter(
    (attempt) => attempt.wordId === targetWord.id,
  ).length;

  const kind = requestedExerciseType
    ? mapExerciseTypeToWordKind(requestedExerciseType)
    : exerciseKinds[targetAttemptCount % exerciseKinds.length] ?? "recognition";

  return buildExercise(
    targetWord,
    kind,
    dueWords.length > 0 ? "due" : "scheduled",
    locale,
    mapWordKindToExerciseType(kind),
  );
}

export function evaluateWordExercise(
  exerciseId: string,
  answer: string,
  word: StudyWord,
): {
  exerciseType: SupportedWordExerciseType;
  idealAnswer: string;
  isCorrect: boolean;
  kind: WordExerciseKind;
  normalizedAnswer: string;
  word: ExerciseResultWord;
} {
  const { kind, wordId } = parseExerciseId(exerciseId);

  if (wordId !== word.id) {
    throw new AppError(400, "The submitted exercise does not match the word.");
  }

  if (kind === "recognition") {
    const normalizedAnswer = normalizeTranslation(answer);
    const acceptedAnswers = buildAcceptedTranslationAnswers(
      word.translation,
      word.translationLanguage,
    );

    return {
      exerciseType: mapWordKindToExerciseType(kind),
      idealAnswer: word.translation,
      isCorrect: acceptedAnswers.has(normalizedAnswer),
      kind,
      normalizedAnswer,
      word: pickExerciseResultWord(word),
    };
  }

  if (kind === "writing") {
    const traceCharacters = getTraceCharacters(word.simplified);
    const traceSubmission = traceCharacters
      ? parseTraceCompletedAnswer(answer)
      : { completed: false, totalMistakes: null };

    if (traceCharacters && traceSubmission.completed) {
      return {
        exerciseType: mapWordKindToExerciseType(kind),
        idealAnswer: word.simplified,
        isCorrect: true,
        kind,
        normalizedAnswer: word.simplified,
        word: pickExerciseResultWord(word),
      };
    }

    const normalizedAnswer = normalizeHanzi(answer);

    return {
      exerciseType: mapWordKindToExerciseType(kind),
      idealAnswer: word.simplified,
      isCorrect: normalizedAnswer === normalizeHanzi(word.simplified),
      kind,
      normalizedAnswer,
      word: pickExerciseResultWord(word),
    };
  }

  const normalizedAnswer = normalizePinyin(answer);
  const idealAnswer = normalizePinyin(word.pinyinCanonical);

  return {
    exerciseType: mapWordKindToExerciseType(kind),
    idealAnswer: word.pinyinCanonical,
    isCorrect: normalizedAnswer === idealAnswer,
    kind,
    normalizedAnswer,
    word: pickExerciseResultWord(word),
  };
}

export function parseExerciseId(exerciseId: string): {
  kind: WordExerciseKind;
  wordId: string;
} {
  const [kindCandidate, wordId] = exerciseId.split(":");

  if (!wordId || !exerciseKinds.includes(kindCandidate as WordExerciseKind)) {
    throw new AppError(400, "The exercise id is invalid.");
  }

  return {
    kind: kindCandidate as WordExerciseKind,
    wordId,
  };
}

export function createExerciseFeedback(result: {
  exerciseType: SupportedWordExerciseType;
  idealAnswer: string;
  isCorrect: boolean;
  kind: WordExerciseKind;
  normalizedAnswer: string;
  word: ExerciseResultWord;
}, locale: AppLocale) {
  const messages = getExerciseMessages(locale);

  if (result.isCorrect) {
    return {
      feedbackDetailed:
        result.kind === "recognition"
          ? messages.correctRecognition(result.word.simplified, result.word.translation)
          : result.kind === "writing"
            ? messages.correctWriting(result.word.translation, result.word.simplified)
            : messages.correctPinyin(
                result.word.simplified,
                result.word.pinyinCanonical,
              ),
      feedbackShort: messages.correctShort,
    };
  }

  return {
    feedbackDetailed:
      result.kind === "recognition"
        ? messages.wrongRecognition(result.word.translation)
        : result.kind === "writing"
          ? messages.wrongWriting(result.word.simplified)
          : messages.wrongPinyin(result.word.pinyinCanonical),
    feedbackShort: messages.wrongShort,
  };
}

function buildExercise(
  word: StudyWord,
  kind: WordExerciseKind,
  queueMode: WordExercise["queueMode"],
  locale: AppLocale,
  exerciseType: SupportedWordExerciseType,
): WordExercise {
  const messages = getExerciseMessages(locale);

  if (kind === "recognition") {
    return {
      exerciseType,
      exerciseId: `${kind}:${word.id}`,
      answerMode: "text",
      inputLabel: messages.meaningLabel,
      inputPlaceholder: messages.meaningPlaceholder,
      kind,
      promptSecondaryText: messages.recognitionSecondary,
      promptText: messages.recognitionPrompt(word.simplified),
      queueMode,
      wordId: word.id,
    };
  }

  if (kind === "writing") {
    const traceCharacters = getTraceCharacters(word.simplified);

    return {
      exerciseType,
      exerciseId: `${kind}:${word.id}`,
      answerMode: traceCharacters ? "trace_character" : "text",
      inputLabel: messages.chineseWordLabel,
      inputPlaceholder: messages.hanziPlaceholder,
      kind,
      promptSecondaryText: `${messages.pinyinLabel}: ${word.pinyinCanonical}`,
      promptText: messages.writingPrompt(word.translation),
      queueMode,
      traceCharacters: traceCharacters ?? undefined,
      wordId: word.id,
    };
  }

  return {
    exerciseType,
    exerciseId: `${kind}:${word.id}`,
    answerMode: "text",
    inputLabel: messages.pinyinLabel,
    inputPlaceholder: messages.pinyinPlaceholder,
    kind,
    promptSecondaryText: messages.pinyinSecondary,
    promptText: messages.pinyinPrompt(word.simplified),
    queueMode,
    wordId: word.id,
  };
}

function mapExerciseTypeToWordKind(
  exerciseType: SupportedWordExerciseType,
): WordExerciseKind {
  if (exerciseType === "character_recognition") {
    return "recognition";
  }

  if (exerciseType === "character_writing") {
    return "writing";
  }

  return "pinyin";
}

function mapWordKindToExerciseType(
  kind: WordExerciseKind,
): SupportedWordExerciseType {
  if (kind === "recognition") {
    return "character_recognition";
  }

  if (kind === "writing") {
    return "character_writing";
  }

  return "pinyin_recognition";
}

function compareScheduledWords(
  leftWord: StudyWord,
  rightWord: StudyWord,
  attempts: StoredExerciseAttempt[],
  scheduleByWordId: Map<string, StoredWordReviewSchedule>,
) {
  const leftSchedule = scheduleByWordId.get(leftWord.id);
  const rightSchedule = scheduleByWordId.get(rightWord.id);
  const leftNextReviewAt = leftSchedule?.nextReviewAt ?? leftWord.createdAt;
  const rightNextReviewAt = rightSchedule?.nextReviewAt ?? rightWord.createdAt;

  if (leftNextReviewAt !== rightNextReviewAt) {
    return leftNextReviewAt.localeCompare(rightNextReviewAt);
  }

  const leftAttemptCount = attempts.filter(
    (attempt) => attempt.wordId === leftWord.id,
  ).length;
  const rightAttemptCount = attempts.filter(
    (attempt) => attempt.wordId === rightWord.id,
  ).length;

  if (leftAttemptCount !== rightAttemptCount) {
    return leftAttemptCount - rightAttemptCount;
  }

  return leftWord.createdAt.localeCompare(rightWord.createdAt);
}

function buildAcceptedTranslationAnswers(
  translation: string,
  translationLanguage: StudyWord["translationLanguage"],
) {
  const acceptedAnswers = new Set<string>();
  const normalizedTranslation = normalizeTranslation(translation);
  const optionalPrefixPattern = getOptionalTranslationPrefixPattern(translationLanguage);

  acceptedAnswers.add(normalizedTranslation);

  if (optionalPrefixPattern) {
    acceptedAnswers.add(normalizedTranslation.replace(optionalPrefixPattern, ""));
  }

  return acceptedAnswers;
}

function normalizeTranslation(value: string) {
  return normalizeStoredTranslation(value).toLowerCase();
}

function normalizeHanzi(value: string) {
  return normalizeStoredChinese(value);
}

function normalizePinyin(value: string) {
  return normalizePinyinForComparison(value);
}

function getTraceCharacters(value: string) {
  const normalizedValue = normalizeHanzi(value);
  const characters = Array.from(normalizedValue);

  if (characters.length === 0) {
    return null;
  }

  return characters.every((character) => /\p{Script=Han}/u.test(character))
    ? characters
    : null;
}

function pickExerciseResultWord(word: StudyWord): ExerciseResultWord {
  return {
    pinyinCanonical: word.pinyinCanonical,
    simplified: word.simplified,
    translation: word.translation,
  };
}

function getOptionalTranslationPrefixPattern(locale: string) {
  if (locale === "en") {
    return /^(to|a|an|the)\s+/;
  }

  if (locale === "it") {
    return /^(il|lo|la|i|gli|le|un|uno|una)\s+/;
  }

  return null;
}

function getUnsupportedExerciseTypeMessage(exerciseType: DocumentedExerciseType) {
  if (exerciseType === "sentence_understanding") {
    return "Sentence understanding is planned but not available yet.";
  }

  if (exerciseType === "gap_fill") {
    return "Gap-fill is planned but not available yet.";
  }

  return "That exercise type is not available yet.";
}

function getExerciseMessages(locale: string) {
  if (locale === "es") {
    return {
      chineseWordLabel: "Palabra en chino",
      correctPinyin: (hanzi: string, pinyin: string) =>
        `Correcto. ${hanzi} se lee ${pinyin}.`,
      correctRecognition: (hanzi: string, translation: string) =>
        `Correcto. ${hanzi} significa "${translation}".`,
      correctShort: "Correcto.",
      correctWriting: (translation: string, hanzi: string) =>
        `Correcto. ${translation} se escribe ${hanzi}.`,
      hanziPlaceholder: "Escribe el hanzi",
      meaningLabel: "Significado",
      meaningPlaceholder: "Escribe el significado",
      pinyinLabel: "Pinyin",
      pinyinPlaceholder: "Usa números o marcas de tono",
      pinyinPrompt: (hanzi: string) => `Escribe el pinyin de ${hanzi}.`,
      pinyinSecondary: "Se aceptan números de tono y marcas de tono.",
      recognitionPrompt: (hanzi: string) => `¿Qué significa ${hanzi}?`,
      recognitionSecondary: "Responde con el significado guardado.",
      writingPrompt: (translation: string) =>
        `Escribe la palabra china para "${translation}".`,
      wrongPinyin: (pinyin: string) =>
        `Usa la forma guardada en pinyin ${pinyin}. Se aceptan números de tono y marcas de tono.`,
      wrongRecognition: (translation: string) =>
        `La traducción guardada es "${translation}".`,
      wrongShort: "Casi.",
      wrongWriting: (hanzi: string) => `La forma guardada en hanzi es ${hanzi}.`,
    };
  }

  if (locale === "de") {
    return {
      chineseWordLabel: "Chinesisches Wort",
      correctPinyin: (hanzi: string, pinyin: string) =>
        `Richtig. ${hanzi} wird ${pinyin} gelesen.`,
      correctRecognition: (hanzi: string, translation: string) =>
        `Richtig. ${hanzi} bedeutet "${translation}".`,
      correctShort: "Richtig.",
      correctWriting: (translation: string, hanzi: string) =>
        `Richtig. ${translation} wird als ${hanzi} geschrieben.`,
      hanziPlaceholder: "Hanzi eingeben",
      meaningLabel: "Bedeutung",
      meaningPlaceholder: "Bedeutung eingeben",
      pinyinLabel: "Pinyin",
      pinyinPlaceholder: "Tonzahlen oder Tonzeichen verwenden",
      pinyinPrompt: (hanzi: string) => `Schreibe das Pinyin für ${hanzi}.`,
      pinyinSecondary: "Tonzahlen und Tonzeichen werden beide akzeptiert.",
      recognitionPrompt: (hanzi: string) => `Was bedeutet ${hanzi}?`,
      recognitionSecondary: "Antworte mit der gespeicherten Bedeutung.",
      writingPrompt: (translation: string) =>
        `Schreibe das chinesische Wort für „${translation}“.`,
      wrongPinyin: (pinyin: string) =>
        `Verwende die gespeicherte Pinyin-Form ${pinyin}. Tonzahlen und Tonzeichen werden beide akzeptiert.`,
      wrongRecognition: (translation: string) =>
        `Die gespeicherte Übersetzung ist "${translation}".`,
      wrongShort: "Noch nicht ganz.",
      wrongWriting: (hanzi: string) => `Die gespeicherte Hanzi-Form ist ${hanzi}.`,
    };
  }

  if (locale === "fr") {
    return {
      chineseWordLabel: "Mot chinois",
      correctPinyin: (hanzi: string, pinyin: string) =>
        `Correct. ${hanzi} se lit ${pinyin}.`,
      correctRecognition: (hanzi: string, translation: string) =>
        `Correct. ${hanzi} signifie « ${translation} ».`,
      correctShort: "Correct.",
      correctWriting: (translation: string, hanzi: string) =>
        `Correct. ${translation} s'écrit ${hanzi}.`,
      hanziPlaceholder: "Entrez le hanzi",
      meaningLabel: "Sens",
      meaningPlaceholder: "Entrez le sens",
      pinyinLabel: "Pinyin",
      pinyinPlaceholder: "Utilisez des chiffres de ton ou des accents",
      pinyinPrompt: (hanzi: string) => `Écris le pinyin de ${hanzi}.`,
      pinyinSecondary: "Les chiffres de ton et les accents sont acceptés.",
      recognitionPrompt: (hanzi: string) => `Que signifie ${hanzi} ?`,
      recognitionSecondary: "Réponds avec le sens enregistré.",
      writingPrompt: (translation: string) =>
        `Écris le mot chinois pour « ${translation} ».`,
      wrongPinyin: (pinyin: string) =>
        `Utilise la forme pinyin enregistrée ${pinyin}. Les chiffres de ton et les accents sont acceptés.`,
      wrongRecognition: (translation: string) =>
        `La traduction enregistrée est « ${translation} ».`,
      wrongShort: "Pas tout à fait.",
      wrongWriting: (hanzi: string) => `La forme hanzi enregistrée est ${hanzi}.`,
    };
  }

  if (locale === "it") {
    return {
      chineseWordLabel: "Parola cinese",
      correctPinyin: (hanzi: string, pinyin: string) =>
        `Corretto. ${hanzi} si legge ${pinyin}.`,
      correctRecognition: (hanzi: string, translation: string) =>
        `Corretto. ${hanzi} significa "${translation}".`,
      correctShort: "Corretto.",
      correctWriting: (translation: string, hanzi: string) =>
        `Corretto. ${translation} si scrive ${hanzi}.`,
      hanziPlaceholder: "Inserisci l'hanzi",
      meaningLabel: "Significato",
      meaningPlaceholder: "Inserisci il significato",
      pinyinLabel: "Pinyin",
      pinyinPlaceholder: "Usa numeri di tono o accenti",
      pinyinPrompt: (hanzi: string) => `Scrivi il pinyin di ${hanzi}.`,
      pinyinSecondary: "Sono accettati sia i numeri di tono sia gli accenti.",
      recognitionPrompt: (hanzi: string) => `Che cosa significa ${hanzi}?`,
      recognitionSecondary: "Rispondi con il significato salvato.",
      writingPrompt: (translation: string) =>
        `Scrivi la parola cinese per "${translation}".`,
      wrongPinyin: (pinyin: string) =>
        `Usa la forma pinyin salvata ${pinyin}. Sono accettati sia i numeri di tono sia gli accenti.`,
      wrongRecognition: (translation: string) =>
        `La traduzione salvata è "${translation}".`,
      wrongShort: "Non proprio.",
      wrongWriting: (hanzi: string) => `La forma hanzi salvata è ${hanzi}.`,
    };
  }

  if (locale === "pt") {
    return {
      chineseWordLabel: "Palavra em chinês",
      correctPinyin: (hanzi: string, pinyin: string) =>
        `Correto. ${hanzi} se lê ${pinyin}.`,
      correctRecognition: (hanzi: string, translation: string) =>
        `Correto. ${hanzi} significa "${translation}".`,
      correctShort: "Correto.",
      correctWriting: (translation: string, hanzi: string) =>
        `Correto. ${translation} se escreve ${hanzi}.`,
      hanziPlaceholder: "Digite o hanzi",
      meaningLabel: "Significado",
      meaningPlaceholder: "Digite o significado",
      pinyinLabel: "Pinyin",
      pinyinPlaceholder: "Use números ou marcas de tom",
      pinyinPrompt: (hanzi: string) => `Escreva o pinyin de ${hanzi}.`,
      pinyinSecondary: "Aceitamos números de tom e marcas tonais.",
      recognitionPrompt: (hanzi: string) => `O que significa ${hanzi}?`,
      recognitionSecondary: "Responda com o significado salvo.",
      writingPrompt: (translation: string) =>
        `Escreva a palavra em chinês para "${translation}".`,
      wrongPinyin: (pinyin: string) =>
        `Use a forma em pinyin salva ${pinyin}. Aceitamos números de tom e marcas tonais.`,
      wrongRecognition: (translation: string) =>
        `A tradução salva é "${translation}".`,
      wrongShort: "Quase.",
      wrongWriting: (hanzi: string) => `A forma hanzi salva é ${hanzi}.`,
    };
  }

  return {
    chineseWordLabel: "Chinese word",
    correctPinyin: (hanzi: string, pinyin: string) =>
      `Correct. ${hanzi} is read as ${pinyin}.`,
    correctRecognition: (hanzi: string, translation: string) =>
      `Correct. ${hanzi} means "${translation}".`,
    correctShort: "Correct.",
    correctWriting: (translation: string, hanzi: string) =>
      `Correct. ${translation} is written as ${hanzi}.`,
    hanziPlaceholder: "Enter hanzi",
    meaningLabel: "Meaning",
    meaningPlaceholder: "Enter meaning",
    pinyinLabel: "Pinyin",
    pinyinPlaceholder: "Use tone numbers or tone marks",
    pinyinPrompt: (hanzi: string) => `Write the pinyin for ${hanzi}.`,
    pinyinSecondary: "Tone numbers or tone marks are both accepted.",
    recognitionPrompt: (hanzi: string) => `What does ${hanzi} mean?`,
    recognitionSecondary: "Answer with the saved meaning.",
    writingPrompt: (translation: string) =>
      `Write the Chinese word for "${translation}".`,
    wrongPinyin: (pinyin: string) =>
      `Use the stored pinyin form ${pinyin}. Tone numbers or tone marks are accepted.`,
    wrongRecognition: (translation: string) =>
      `The stored translation is "${translation}".`,
    wrongShort: "Not quite.",
    wrongWriting: (hanzi: string) => `The stored hanzi form is ${hanzi}.`,
  };
}
