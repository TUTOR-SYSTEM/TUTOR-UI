"use client";

import { useLocale } from "@/hooks/useLocale.hook";
import { flowRequestDictionary } from "@/lib/i18n/flow-request.dictionary";

export function useFlowRequestCopy() {
  const { language, setLocale } = useLocale();

  return { ...flowRequestDictionary[language], language, setLocale };
}