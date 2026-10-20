import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

import type { ApiUser } from "@/types";
import {
  AUTH_STORE_KEY,
  clearLegacyAuthTokens,
} from "@/lib/axios/auth-storage";
import { DEVTOOLS_CONNECTION_NAME } from "./devtools";
import { safeStorage } from "./storage";

/**
 * Chỉ access token nằm phía client. Refresh token là cookie httpOnly do gateway set
 * (`path=/auth`), JS không đọc được — xem `lib/axios/auth-refresh.ts`.
 */
export type AuthState = {
  accessToken: string | null;
  user: ApiUser | null;
  /** Đã xử lý xong bước kiểm tra session (sau khi tải profile). Không persist. */
  sessionChecked: boolean;
};

export type AuthActions = {
  /** Phiên mới (login / OAuth): reset profile, buộc kiểm tra lại session. */
  startSession: (accessToken: string) => void;
  /** Làm mới access token (refresh): giữ nguyên profile đang có. */
  setCredentials: (payload: { accessToken: string }) => void;
  patchAccessToken: (accessToken: string) => void;
  setUser: (user: ApiUser) => void;
  setSessionChecked: (checked: boolean) => void;
  clearAuth: () => void;
};

const initialState: AuthState = {
  accessToken: null,
  user: null,
  sessionChecked: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        startSession: (accessToken) =>
          set(
            { accessToken, user: null, sessionChecked: false },
            false,
            "auth/startSession",
          ),

        setCredentials: ({ accessToken }) =>
          set({ accessToken }, false, "auth/setCredentials"),

        patchAccessToken: (accessToken) =>
          set({ accessToken }, false, "auth/patchAccessToken"),

        setUser: (user) => set({ user }, false, "auth/setUser"),

        setSessionChecked: (sessionChecked) =>
          set({ sessionChecked }, false, "auth/setSessionChecked"),

        clearAuth: () => {
          // Xóa key localStorage của thiết kế cũ (refresh token / bản sao access token).
          clearLegacyAuthTokens();
          set({ ...initialState, sessionChecked: true }, false, "auth/clearAuth");
        },
      }),
      {
        name: AUTH_STORE_KEY,
        storage: createJSONStorage(() => safeStorage),
        // Một nơi duy nhất cho access token. User/sessionChecked tính lại lúc runtime.
        partialize: (state) => ({ accessToken: state.accessToken }),
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
