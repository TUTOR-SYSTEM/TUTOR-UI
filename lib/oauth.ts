const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8888";

const PENDING_KEY = "oauth:pending";
/** Khớp TTL state cookie phía gateway (10 phút). */
const PENDING_TTL_MS = 10 * 60 * 1000;

/**
 * Đánh dấu một lần đăng nhập OAuth do chính tab này khởi tạo. Callback chỉ nhận token khi có
 * dấu này, nên một link `/oauth/callback#accessToken=...` tự tạo (login CSRF / session fixation)
 * không được lưu thành phiên.
 */
export function markOAuthAttempt(now: number = Date.now()): void {
  try {
    window.sessionStorage.setItem(PENDING_KEY, String(now));
  } catch {
    // sessionStorage không khả dụng: callback sẽ từ chối (fail closed).
  }
}

/** Đọc và xóa dấu OAuth đang chờ. Trả `true` chỉ khi dấu còn hạn. */
export function consumeOAuthAttempt(now: number = Date.now()): boolean {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    window.sessionStorage.removeItem(PENDING_KEY);
    if (!raw) return false;
    const startedAt = Number(raw);
    return Number.isFinite(startedAt) && now - startedAt <= PENDING_TTL_MS;
  } catch {
    return false;
  }
}

/** Full-page navigation into the backend's Google OAuth flow (must leave the SPA). */
export function startGoogleOAuth(): void {
  markOAuthAttempt();
  window.location.href = `${API_BASE_URL}/auth/google`;
}

/** Full-page navigation into the backend's Facebook OAuth flow. */
export function startFacebookOAuth(): void {
  markOAuthAttempt();
  window.location.href = `${API_BASE_URL}/auth/facebook`;
}
