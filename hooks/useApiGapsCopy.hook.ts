"use client";

import { apiGapsDictionary } from "@/lib/i18n/api-gaps.dictionary";
import { useLocale } from "@/hooks/useLocale.hook";

export function useApiGapsCopy() {
  const { language, setLocale } = useLocale();
  return { ...apiGapsDictionary[language], language, setLocale };
}
