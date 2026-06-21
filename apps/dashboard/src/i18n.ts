import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/km";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import km from "./locales/km.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      km: { translation: km },
    } as const,
    supportedLngs: ["en", "km"],
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  } as Parameters<typeof i18n.init>[0]);

// Keep dayjs locale in sync with the active i18next language.
i18n.on("languageChanged", (lng) => {
  dayjs.locale(lng.split("-")[0]);
});

export default i18n;
