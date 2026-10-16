import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

import type { ApiUser } from "@/types";
import { clearAuthTokens } from "@/lib/axios/auth-storage";
import { DEVTOOLS_CONNECTION_NAME } from "./devtools";
import { safeStorage } from "./storage";

export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: ApiUser | null;
  /** Đã xử lý xong bước kiểm tra token (hoặc không có token để kiểm tra). Không persist. */
  sessionChecked: boolean;
};

export type AuthActions = {
  setCredentials: (payload: {
    accessToken: string;
    refreshToken?: string | null;
  }) => void;
  patchAccessToken: (accessToken: string) => void;
  setUser: (user: ApiUser) => void;
  setSessionChecked: (checked: boolean) => void;
  clearAuth: () => void;
};

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  sessionChecked: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setCredentials: ({ accessToken, refreshToken }) =>
          set(
            (state) => ({
              accessToken,
              refreshToken:
                refreshToken !== undefined ? refreshToken : state.refreshToken,
            }),
            false,
            "auth/setCredentials",
          ),

        patchAccessToken: (accessToken) =>
          set({ accessToken }, false, "auth/patchAccessToken"),

        setUser: (user) => set({ user }, false, "auth/setUser"),

        setSessionChecked: (sessionChecked) =>
          set({ sessionChecked }, false, "auth/setSessionChecked"),

        clearAuth: () => {
          // Drop the legacy `accessToken`/`refreshToken` localStorage keys too, so a
          // cleared session can't fall back to a stale token (see client.ts).
          clearAuthTokens();
          set(
            { ...initialState, sessionChecked: true },
            false,
            "auth/clearAuth",
          );
        },
      }),
      {
        name: "auth-store",
        storage: createJSONStorage(() => safeStorage),
        // Chỉ persist token — user/sessionChecked luôn tính lại lúc runtime,
        // giống whitelist ["accessToken", "refreshToken"] của redux-persist cũ.
        partialize: (state) => ({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
        }),
        // Tự rehydrate trong effect (xem `zustand/hydrate.ts`) để tránh
        // SSR/CSR mismatch — server không có `localStorage`.
        skipHydration: true,
      },
    ),
    {
      name: DEVTOOLS_CONNECTION_NAME,
      store: "auth",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
