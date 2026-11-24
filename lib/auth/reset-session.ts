const KEY = "reset-password-session";

/** Email + mã OTP đã nhập ở bước /verify-otp, giữ trong sessionStorage (không đưa mã lên URL). */
export type ResetSession = { email: string; otp: string };

export function saveResetSession(session: ResetSession): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function readResetSession(): ResetSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ResetSession>;
    if (typeof parsed.email === "string" && typeof parsed.otp === "string") {
      return { email: parsed.email, otp: parsed.otp };
    }
  } catch {
    /* ignore corrupt value */
  }
  return null;
}

export function clearResetSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}
