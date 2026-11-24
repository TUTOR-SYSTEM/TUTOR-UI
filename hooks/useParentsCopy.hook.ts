"use client";

import { useLocale } from "@/hooks/useLocale.hook";
import { parentsDictionary } from "@/lib/i18n/parents.dictionary";

export function useParentsCopy() {
  const { language, setLocale } = useLocale();

  return { ...parentsDictionary[language], language, setLocale };
}
