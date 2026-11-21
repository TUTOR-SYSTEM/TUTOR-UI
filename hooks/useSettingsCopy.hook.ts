"use client";

import { useLocale } from "@/hooks/useLocale.hook";
import { settingsDictionary } from "@/lib/i18n/settings.dictionary";

export function useSettingsCopy() {
  const { language, setLocale } = useLocale();

  return { ...settingsDictionary[language], language, setLocale };
}
