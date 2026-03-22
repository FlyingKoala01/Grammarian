import { useState } from "react";

import type { AppLocale } from "@grammarian/shared";
import { appLocaleOptions } from "@grammarian/shared";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import logoSmall from "../../../assets/logo_small.png";

interface DemoLoginCardProps {
  errorMessage?: string;
  isSubmitting: boolean;
  onLogin: (displayName: string) => void | Promise<void>;
  onPreferredLanguageChange: (value: AppLocale) => void;
  preferredLanguage: AppLocale;
}

export function DemoLoginCard({
  errorMessage,
  isSubmitting,
  onLogin,
  onPreferredLanguageChange,
  preferredLanguage,
}: DemoLoginCardProps) {
  const [displayName, setDisplayName] = useState("");
  const { messages } = useI18n();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin(displayName);
  }

  return (
    <section className="rounded-[2rem] border border-[#e6d8c8] bg-white/92 px-6 py-7 text-slate-950 shadow-[0_18px_48px_rgba(66,38,20,0.08)] sm:px-8 sm:py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.15rem] border border-[#e2c6a8] bg-[#faf5ee]">
            <img
              alt="Grammarian logo"
              className="h-8 w-8 object-contain"
              src={logoSmall}
            />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold leading-tight text-balance text-slate-950">
              {messages.sessionTitle}
            </h2>
            <FieldDescription className="mx-auto max-w-md text-center text-sm leading-7 text-slate-600">
              {messages.demoLoginHelp}
            </FieldDescription>
          </div>
        </div>

        <form className="relative" onSubmit={handleSubmit}>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel className="text-slate-700" htmlFor="preferred-language">
                {messages.language}
              </FieldLabel>
              <select
                className="h-12 w-full rounded-[1.2rem] border border-[#d9c1a7] bg-[#fcfaf7] px-4 text-base text-slate-950 outline-none transition focus:border-[#c86b37]"
                disabled={isSubmitting}
                id="preferred-language"
                onChange={(event) =>
                  onPreferredLanguageChange(event.target.value as AppLocale)
                }
                value={preferredLanguage}
              >
                {appLocaleOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.nativeName}
                  </option>
                ))}
              </select>
              <FieldDescription className="text-sm leading-6 text-slate-600">
                {messages.languageHelp}
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel className="text-slate-700" htmlFor="display-name">
                {messages.learnerName}
              </FieldLabel>
              <Input
                autoComplete="off"
                className="h-12 rounded-[1.2rem] border-[#d9c1a7] bg-[#fcfaf7] px-4 text-base text-slate-950 placeholder:text-slate-400 focus-visible:border-[#c86b37] focus-visible:ring-[#c86b37]/18"
                disabled={isSubmitting}
                id="display-name"
                maxLength={40}
                minLength={2}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={messages.learnerNamePlaceholder}
                required
                value={displayName}
              />
            </Field>

            {errorMessage ? (
              <FieldError className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 leading-6 text-rose-700">
                {errorMessage}
              </FieldError>
            ) : null}

            <Field>
              <Button
                className="h-12 rounded-[1.2rem] bg-[#c7642d] text-white hover:bg-[#b85724]"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? messages.startingSession : messages.continue}
              </Button>
            </Field>
          </FieldGroup>
        </form>

        <FieldDescription className="px-2 text-center text-sm leading-7 text-slate-600">
          {messages.demoLoginFootnote}
        </FieldDescription>
      </div>
    </section>
  );
}
