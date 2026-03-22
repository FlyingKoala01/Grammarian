const bareVowels = ["a", "e", "i", "o", "u", "\u00fc"] as const;

const toneMarkMap = {
  a: ["a", "\u0101", "\u00e1", "\u01ce", "\u00e0"],
  e: ["e", "\u0113", "\u00e9", "\u011b", "\u00e8"],
  i: ["i", "\u012b", "\u00ed", "\u01d0", "\u00ec"],
  o: ["o", "\u014d", "\u00f3", "\u01d2", "\u00f2"],
  u: ["u", "\u016b", "\u00fa", "\u01d4", "\u00f9"],
  "\u00fc": ["\u00fc", "\u01d6", "\u01d8", "\u01da", "\u01dc"],
} as const;

const accentedToBareMap = new Map<string, { letter: string; tone: string }>(
  Object.entries(toneMarkMap).flatMap(([letter, tones]) =>
    tones.slice(1).map((toneCharacter, index) => [
      toneCharacter,
      { letter, tone: String(index + 1) },
    ]),
  ),
);

export function canonicalizePinyinToToneNumbers(value: string) {
  const cleanedValue = value
    .trim()
    .toLowerCase()
    .replace(/u:/g, "\u00fc")
    .replace(/v/g, "\u00fc");

  if (!cleanedValue) {
    return "";
  }

  const syllables = cleanedValue
    .split(/[\s'-]+/)
    .map((syllable) => syllable.trim())
    .filter(Boolean)
    .map((syllable) => normalizePinyinSyllableToToneNumbers(syllable));

  return syllables.join(" ");
}

export function normalizePinyinForComparison(value: string) {
  return canonicalizePinyinToToneNumbers(value).replace(/\s+/g, "");
}

export function normalizePinyinForStorage(value: string) {
  return renderPinyinWithToneMarks(value);
}

export function renderPinyinWithToneMarks(value: string) {
  const canonicalValue = canonicalizePinyinToToneNumbers(value);

  if (!canonicalValue) {
    return "";
  }

  return canonicalValue
    .split(" ")
    .map((syllable) => convertSyllableToToneMarks(syllable))
    .join(" ");
}

export function containsToneMarks(value: string) {
  return [...value].some((character) => accentedToBareMap.has(character));
}

export function hasPinyinToneInformation(value: string) {
  return /[1-5]/.test(value) || containsToneMarks(value);
}

export function getToneSuggestionTarget(value: string) {
  const canonicalValue = canonicalizePinyinToToneNumbers(value);

  if (!canonicalValue || canonicalValue.includes(" ")) {
    return null;
  }

  const letters = canonicalValue.replace(/[1-5]/g, "");
  const vowelIndex = pickToneMarkIndex(letters);

  if (vowelIndex === -1) {
    return null;
  }

  const vowel = letters[vowelIndex];

  if (!vowel || !isBareVowel(vowel)) {
    return null;
  }

  return {
    options: toneMarkMap[vowel].slice(1),
    syllable: letters,
    vowel,
  };
}

function normalizePinyinSyllableToToneNumbers(syllable: string) {
  let letters = "";
  let tone = "";

  for (const character of syllable) {
    if (/[1-5]/.test(character)) {
      tone = character;
      continue;
    }

    const accentedCharacter = accentedToBareMap.get(character);

    if (accentedCharacter) {
      letters += accentedCharacter.letter;
      tone = accentedCharacter.tone;
      continue;
    }

    if (/[a-z\u00fc]/.test(character)) {
      letters += character;
    }
  }

  return `${letters}${tone}`;
}

function convertSyllableToToneMarks(syllable: string) {
  const match = syllable.match(/^([a-z\u00fc]+)([1-5])?$/);

  if (!match) {
    return syllable;
  }

  const letters = match[1];
  const tone = match[2] ?? "5";

  if (!letters) {
    return syllable;
  }

  if (tone === "5") {
    return letters;
  }

  const vowelIndex = pickToneMarkIndex(letters);

  if (vowelIndex === -1) {
    return syllable;
  }

  const vowel = letters[vowelIndex];

  if (!vowel || !isBareVowel(vowel)) {
    return syllable;
  }

  const replacement = toneMarkMap[vowel][Number(tone)] ?? vowel;

  return `${letters.slice(0, vowelIndex)}${replacement}${letters.slice(vowelIndex + 1)}`;
}

function pickToneMarkIndex(letters: string) {
  const aIndex = letters.indexOf("a");

  if (aIndex !== -1) {
    return aIndex;
  }

  const eIndex = letters.indexOf("e");

  if (eIndex !== -1) {
    return eIndex;
  }

  const ouIndex = letters.indexOf("ou");

  if (ouIndex !== -1) {
    return ouIndex;
  }

  for (let index = letters.length - 1; index >= 0; index -= 1) {
    const character = letters[index];

    if (character && bareVowels.includes(character as (typeof bareVowels)[number])) {
      return index;
    }
  }

  return -1;
}

function isBareVowel(value: string): value is keyof typeof toneMarkMap {
  return bareVowels.includes(value as (typeof bareVowels)[number]);
}
