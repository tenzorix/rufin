import { useTranslation } from "react-i18next";

export type Language = "ru" | "en";

export function useI18n() {
  const { t, i18n } = useTranslation();
  const language: Language = i18n.language?.startsWith("en") ? "en" : "ru";

  return {
    t,
    language,
    setLanguage: i18n.changeLanguage.bind(i18n),
  };
}

