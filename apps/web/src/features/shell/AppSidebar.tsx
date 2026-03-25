import type { AppLocale, LearnerProfile, StudyProgressSummary } from "@grammarian/shared";
import { appLocaleOptions } from "@grammarian/shared";
import { BookMarked, BrainCircuit, LogOut, Sparkles, UserRound } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useI18n } from "@/lib/i18n";
import type { AppThemeMode } from "@/lib/theme";

type SidebarView = "dictionary" | "exercises";

interface AppSidebarProps {
  activeView: SidebarView;
  isUpdatingPreferredLanguage: boolean;
  onChangePreferredLanguage: (value: AppLocale) => void;
  onChangeView: (view: SidebarView) => void;
  onLogout: () => void;
  onToggleTheme: () => void;
  preferredLanguage: AppLocale;
  progress: StudyProgressSummary;
  themeMode: AppThemeMode;
  user: LearnerProfile;
}

export function AppSidebar({
  activeView,
  isUpdatingPreferredLanguage,
  onChangePreferredLanguage,
  onChangeView,
  onLogout,
  onToggleTheme,
  preferredLanguage,
  progress,
  themeMode,
  user,
}: AppSidebarProps) {
  const { formatDateTime, messages } = useI18n();
  const navigationItems = [
    {
      icon: BookMarked,
      label: messages.dictionary,
      value: "dictionary",
    },
    {
      icon: BrainCircuit,
      label: messages.exercises,
      value: "exercises",
    },
  ] as const;

  return (
    <Sidebar collapsible="none" variant="inset">
      <SidebarHeader className="gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-[hsl(var(--sidebar-accent))] px-3 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Grammarian</p>
            <p className="text-xs text-slate-500 dark:text-stone-400">{user.displayName}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    isActive={activeView === item.value}
                    onClick={() => onChangeView(item.value)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <div className="rounded-xl border border-white/80 bg-white/70 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-stone-300">
            <p className="font-medium text-slate-900 dark:text-stone-100">
              {messages.wordsSummary(progress.totalWords)}
            </p>
            <p className="mt-1">
              {progress.dueReviewCount > 0
                ? messages.dueNowCount(progress.dueReviewCount)
                : progress.nextReviewAt
                  ? messages.nextReview(formatDateTime(progress.nextReviewAt))
                  : messages.noReviewsScheduled}
            </p>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-xl bg-[hsl(var(--sidebar-accent))] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 dark:bg-white/10 dark:text-stone-200">
              <UserRound className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-stone-100">
                {user.displayName}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-stone-300">
              <span className="font-medium text-slate-900 dark:text-stone-100">{messages.language}</span>
              <select
                className="h-10 w-full rounded-xl border border-white/80 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 dark:border-white/12 dark:bg-white/8 dark:text-stone-100"
                disabled={isUpdatingPreferredLanguage}
                onChange={(event) =>
                  onChangePreferredLanguage(event.target.value as AppLocale)
                }
                value={preferredLanguage}
              >
                {appLocaleOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.nativeName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ThemeToggle
            className="mt-3 w-full rounded-xl"
            mode={themeMode}
            onToggle={onToggleTheme}
          />

          <Button
            className="mt-3 w-full rounded-xl px-4 py-2.5"
            onClick={onLogout}
            variant="ghost"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {messages.logOut}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
