"use client";

import { useLocale } from "@/hooks/useLocale.hook";
import { usersDictionary } from "@/lib/i18n/users.dictionary";

export function useUsersCopy() {
  const { language, setLocale } = useLocale();

  return { ...usersDictionary[language], language, setLocale };
}
