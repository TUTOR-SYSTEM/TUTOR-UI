/** Tên key persist của `useAuthStore` (zustand). */
export const AUTH_STORE_KEY = "auth-store";

const LEGACY_ACCESS_KEY = "accessToken";
const LEGACY_REFRESH_KEY = "refreshToken";

/**
 * Access token đọc thẳng từ bản persist của `useAuthStore` (cùng một key). Dùng khi store chưa
 * rehydrate (request đầu tiên trước `AuthProvider`). Không có bản sao thứ hai.
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { accessToken?: unknown } };
    const token = parsed?.state?.accessToken;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

/** Xóa key localStorage của thiết kế cũ (access/refresh token rời). */
export function clearLegacyAuthTokens(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_ACCESS_KEY);
    window.localStorage.removeItem(LEGACY_REFRESH_KEY);
  } catch {
    // localStorage not available
  }
}
