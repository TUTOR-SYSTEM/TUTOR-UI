"use client";

import { useLocale } from "@/hooks/useLocale.hook";
import { loggerDictionary } from "@/lib/i18n/logger.dictionary";

export function useLoggerCopy() {
  const { language, setLocale } = useLocale();

  return { ...loggerDictionary[language], language, setLocale };
}
