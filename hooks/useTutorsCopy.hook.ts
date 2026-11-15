"use client";

import { useLocale } from "@/hooks/useLocale.hook";
import { tutorsDictionary } from "@/lib/i18n/tutors.dictionary";

export function useTutorsCopy() {
  const { language, setLocale } = useLocale();

  return { ...tutorsDictionary[language], language, setLocale };
}
