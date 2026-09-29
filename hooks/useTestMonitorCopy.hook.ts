"use client";

import { useLocale } from "@/hooks/useLocale.hook";
import { testMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";

export function useTestMonitorCopy() {
  const { language, setLocale } = useLocale();

  return { ...testMonitorDictionary[language], language, setLocale };
}
