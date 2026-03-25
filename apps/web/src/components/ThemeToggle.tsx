import { MoonStar, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import type { AppThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
  mode: AppThemeMode;
  onToggle: () => void;
}

export function ThemeToggle({
  className,
  compact = false,
  mode,
  onToggle,
}: ThemeToggleProps) {
  const { messages } = useI18n();
  const isDarkMode = mode === "dark";
  const Icon = isDarkMode ? MoonStar : SunMedium;
  const actionLabel = isDarkMode
    ? messages.themeToggleToLight
    : messages.themeToggleToDark;

  return (
    <Button
      aria-label={actionLabel}
      className={cn(compact ? "h-10 w-10 rounded-xl px-0 py-0" : "", className)}
      onClick={onToggle}
      title={actionLabel}
      type="button"
      variant="outline"
    >
      <Icon className="h-4 w-4" />
      {compact ? <span className="sr-only">{actionLabel}</span> : null}
      {!compact ? (
        <>
          <span className="ml-2">{messages.theme}</span>
          <span className="ml-1 text-xs uppercase tracking-[0.18em] opacity-70">
            {isDarkMode ? messages.themeDark : messages.themeLight}
          </span>
        </>
      ) : null}
    </Button>
  );
}
