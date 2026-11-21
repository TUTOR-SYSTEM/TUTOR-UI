"use client";

import { useLocale } from "@/hooks/useLocale.hook";
import { allClassesDictionary } from "@/lib/i18n/all-classes.dictionary";

export function useAllClassesCopy() {
  const { language, setLocale } = useLocale();

  return { ...allClassesDictionary[language], language, setLocale };
}
