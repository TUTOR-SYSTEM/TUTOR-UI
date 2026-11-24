"use client";

import { useLocale } from "@/hooks/useLocale.hook";
import { changePasswordDictionary } from "@/lib/i18n/change-password.dictionary";

export function useChangePasswordCopy() {
  const { language, setLocale } = useLocale();

  return { ...changePasswordDictionary[language], language, setLocale };
}
