export const themeStorageKey = "grammarian.theme";

export const appThemeModes = ["light", "dark"] as const;

export type AppThemeMode = (typeof appThemeModes)[number];

export function isAppThemeMode(value: string | null | undefined): value is AppThemeMode {
  return value === "light" || value === "dark";
}

export function getInitialThemeMode(): AppThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedValue = window.localStorage.getItem(themeStorageKey);
  const themeMode =
    isAppThemeMode(storedValue)
      ? storedValue
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

  applyThemeMode(themeMode);

  return themeMode;
}

export function applyThemeMode(themeMode: AppThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  root.classList.toggle("dark", themeMode === "dark");
  root.style.colorScheme = themeMode;
}
