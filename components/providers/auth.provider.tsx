"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { ApiUser } from "@/types";
import { ApiError } from "@/types";
import { apiGet } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useAuthStore } from "@/zustand/auth.store";
import { useGlobalStore } from "@/zustand/global.store";
import { useLocaleStore } from "@/zustand/locale.store";
import { useHasHydrated, useHydrateOnMount } from "@/zustand/hydrate";

/**
 * `accessToken`/`user` sống trong `useAuthStore` (zustand, xem `zustand/auth.store.ts`); refresh
 * token là cookie httpOnly. Hook này chỉ đọc/ghi, không tự chạy kiểm tra session (việc đó do
 * `AuthProvider` đảm nhiệm, mount một lần ở root layout).
 */
export const useAuth = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const sessionChecked = useAuthStore((s) => s.sessionChecked);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const startSession = useAuthStore((s) => s.startSession);
  const hasHydrated = useHasHydrated(useAuthStore);

  const clearSession = useCallback(() => clearAuth(), [clearAuth]);

  return {
    accessToken,
    user,
    /** Đã xử lý xong bước kiểm tra token (hoặc không có token để kiểm tra). */
    isAuthReady: hasHydrated && (!accessToken || sessionChecked),
    /**
     * Có access token VÀ server đã trả profile. Chưa có profile (vừa login, đang tải, hoặc lỗi
     * tạm thời) thì chưa coi là đã đăng nhập.
     */
    isAuthenticated: Boolean(accessToken) && sessionChecked && user !== null,
    /** Bắt đầu phiên mới sau login / OAuth (profile cũ bị bỏ, session kiểm tra lại). */
    startSession,
    /** Xóa state phía client. Để thu hồi phía server, gọi `useAuthActions().logout` trước. */
    clearSession,
  };
};

/**
 * Mount một lần ở root layout (`app/layout.tsx`). Rehydrate các zustand store persist
 * (`skipHydration: true` — tránh SSR/CSR mismatch, xem `zustand/hydrate.ts`) rồi xác thực
 * session hiện tại trong nền.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  useHydrateOnMount(useAuthStore);
  useHydrateOnMount(useLocaleStore);
  useHydrateOnMount(useGlobalStore);
  const hasHydrated = useHasHydrated(useAuthStore);

  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionChecked = useAuthStore((s) => s.setSessionChecked);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    if (!hasHydrated || !accessToken) {
      return;
    }

    let cancelled = false;

    // Axios interceptor đã tự refresh khi gặp 401 (refresh cookie). Vì vậy 401 ở đây nghĩa là
    // phiên thật sự hết hạn; lỗi khác (mạng, 5xx, refresh tạm thời lỗi) KHÔNG xóa token —
    // người dùng không bị đăng xuất vì một lần lỗi mạng.
    const verifySession = async () => {
      setSessionChecked(false);
      try {
        const raw = await apiGet<unknown>("/users/detail-user");
        const user = unwrapApiData<ApiUser>(raw);
        if (!cancelled) {
          setUser(user);
          setSessionChecked(true);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.statusCode === 401) {
          clearAuth();
          return;
        }
        setSessionChecked(true);
      }
    };

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, accessToken, setUser, setSessionChecked, clearAuth]);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (pathname === "/login" && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, pathname, router]);

  return <>{children}</>;
};
