import { useLocaleStore } from "@/zustand/locale.store";
import type { Language } from "@/types";

/**
 * Display name in the order that reads naturally for the locale:
 * Vietnamese is "Họ Tên" (last name first), English is "First Last".
 * Empty parts are dropped; returns `""` when both are empty so the caller picks its fallback.
 */
export function formatPersonName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  language: Language,
): string {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";
  const parts = language === "vi" ? [last, first] : [first, last];
  return parts.filter(Boolean).join(" ");
}

/** Same as `formatPersonName`, for helpers outside React that cannot call `useLocale`. */
export function currentPersonName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  return formatPersonName(firstName, lastName, useLocaleStore.getState().language);
}
