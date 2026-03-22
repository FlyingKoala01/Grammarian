export const appLocales = ["en", "it"] as const;

export type AppLocale = (typeof appLocales)[number];

export const defaultAppLocale: AppLocale = "en";

export interface AppLocaleOption {
  code: AppLocale;
  englishName: string;
  nativeName: string;
}

export const appLocaleOptions: AppLocaleOption[] = [
  {
    code: "en",
    englishName: "English",
    nativeName: "English",
  },
  {
    code: "it",
    englishName: "Italian",
    nativeName: "Italiano",
  },
];

export function isAppLocale(value: string): value is AppLocale {
  return appLocales.includes(value as AppLocale);
}

export function normalizeAppLocale(value: string | null | undefined): AppLocale {
  return value && isAppLocale(value) ? value : defaultAppLocale;
}

export function getAppLocaleOption(locale: AppLocale) {
  return (
    appLocaleOptions.find((option) => option.code === locale) ??
    appLocaleOptions[0]!
  );
}

export function getAppLocaleEnglishName(locale: AppLocale) {
  return getAppLocaleOption(locale).englishName;
}

export function getAppLocaleNativeName(locale: AppLocale) {
  return getAppLocaleOption(locale).nativeName;
}
