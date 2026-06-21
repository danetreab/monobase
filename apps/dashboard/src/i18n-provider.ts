import { useEffect, useState } from "react";
import type { I18nProvider } from "@refinedev/core";
import i18n from "./i18n";

// Returns a fresh i18nProvider object each time the language changes.
// The new object reference is what tells Refine's TranslationContext to
// re-render — a stable singleton reference keeps Refine stale even though
// i18next itself has switched language.
export function useI18nProvider(): I18nProvider {
  const [locale, setLocale] = useState(
    () => (i18n.resolvedLanguage ?? i18n.language ?? "en").split("-")[0],
  );

  useEffect(() => {
    const sync = (lng: string) => setLocale(lng.split("-")[0]);
    i18n.on("languageChanged", sync);
    return () => {
      i18n.off("languageChanged", sync);
    };
  }, []);

  return {
    translate: (key, options) => i18n.t(key, options as Record<string, unknown>),
    changeLocale: (lang) => i18n.changeLanguage(lang),
    getLocale: () => locale,
  };
}
