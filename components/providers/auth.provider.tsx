"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { ApiUser } from "@/types";
import { ApiError } from "@/types";
import { refreshAccessTokenViaStore } from "@/lib/axios/refresh-access-token";
import {
  clearAuthTokens,
  setAuthTokens as saveAuthTokens,
} from "@/lib/axios/auth-storage";
import { apiGet } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useAuthStore } from "@/zustand/auth.store";
import { useGlobalStore } from "@/zustand/global.store";
import { useLocaleStore } from "@/zustand/locale.store";
import { useHasHydrated, useHydrateOnMount } from "@/zustand/hydrate";

/**
 * `accessToken`/`refreshToken`/`user` sống trong `useAuthStore` (zustand,
 * xem `zustand/auth.store.ts`) — hook này chỉ đọc/ghi, không tự chạy
 * side-effect kiểm tra session (việc đó do `AuthProvider` đảm nhiệm, mount
 * một lần ở root layout, để tránh nhiều lần gọi trùng `/users/detail-user`
 * khi nhiều component cùng gọi `useAuth()`).
 */
export const useAuth = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const sessionChecked = useAuthStore((s) => s.sessionChecked);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setCredentials = useAuthStore((s) => s.setCredentials);
  const patchAccessToken = useAuthStore((s) => s.patchAccessToken);
  const hasHydrated = useHasHydrated(useAuthStore);

  const setAccessToken = useCallback(
    (token: string | null) => {
      if (token) {
        patchAccessToken(token);
        return;
      }
      clearAuth();
      clearAuthTokens();
    },
    [patchAccessToken, clearAuth],
  );

  const setAuthTokens = useCallback(
    (payload: { accessToken: string; refreshToken?: string | null }) => {
      setCredentials(payload);
      saveAuthTokens(payload.accessToken, payload.refreshToken);
    },
    [setCredentials],
  );

  return {
    accessToken,
    refreshToken,
    /** Đã xử lý xong bước kiểm tra token (hoặc không có token để kiểm tra). */
    isAuthReady: hasHydrated && (!accessToken || sessionChecked),
    /** Có access token và server xác nhận session (GET profile / refresh + profile). */
    isAuthenticated: Boolean(accessToken) && sessionChecked,
    setAccessToken,
    setAuthTokens,
  };
};

/**
 * Mount một lần ở root layout (`app/layout.tsx`). Rehydrate các zustand store
 * persist (`skipHydration: true` — tránh SSR/CSR mismatch, xem
 * `zustand/hydrate.ts`) rồi xác thực session hiện tại trong nền.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  useHydrateOnMount(useAuthStore);
  useHydrateOnMount(useLocaleStore);
  useHydrateOnMount(useGlobalStore);
  const hasHydrated = useHasHydrated(useAuthStore);

  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionChecked = useAuthStore((s) => s.setSessionChecked);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    if (!hasHydrated || !accessToken) {
      return;
    }

    let cancelled = false;

    const verifySession = async () => {
      setSessionChecked(false);

      const failUnauthorized = () => {
        if (!cancelled) {
          clearAuth();
          clearAuthTokens();
        }
      };

      try {
        const raw = await apiGet<unknown>("/users/detail-user");
        const user = unwrapApiData<ApiUser>(raw);
        if (!cancelled) {
          setUser(user);
          setSessionChecked(true);
        }
        return;
      } catch (err) {
        if (cancelled) {
          return;
        }
        const status = err instanceof ApiError ? err.statusCode : undefined;
        if (status !== 401) {
          setSessionChecked(true);
          return;
        }
      }

      if (!refreshToken) {
        failUnauthorized();
        return;
      }

      // Shared single-flight refresh (also used by the axios 401 interceptor): the store's
      // current refresh token is used, so a token already rotated by the interceptor isn't
      // replayed, and the new tokens are persisted to localStorage.
      const refreshed = await refreshAccessTokenViaStore();
      if (cancelled) {
        return;
      }
      if (!refreshed) {
        failUnauthorized();
        return;
      }
      try {
        const refreshRaw = await apiGet<unknown>("/users/detail-user");
        const refreshUser = unwrapApiData<ApiUser>(refreshRaw);
        if (!cancelled) {
          setUser(refreshUser);
          setSessionChecked(true);
        }
      } catch {
        failUnauthorized();
      }
    };

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [
    hasHydrated,
    accessToken,
    refreshToken,
    setUser,
    setSessionChecked,
    clearAuth,
  ]);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (pathname === "/login" && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, pathname, router]);

  return <>{children}</>;
};
