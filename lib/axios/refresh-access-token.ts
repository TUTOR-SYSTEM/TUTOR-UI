import axios from "axios";

import { postAuthRefresh } from "@/lib/axios/auth-refresh";
import { setAuthTokens as saveAuthTokens } from "@/lib/axios/auth-storage";
import { useAuthStore } from "@/zustand/auth.store";

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Only a definitive rejection of the refresh token ends the session. A network failure or a
 * 5xx from `/auth/refresh` (flaky connection) keeps the stored tokens so the user isn't logged
 * out while the refresh token is still valid.
 */
const isRefreshRejected = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return true;
  const status = error.response?.status;
  return status === 400 || status === 401 || status === 403;
};

export const performRefresh = async (): Promise<boolean> => {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    useAuthStore.getState().clearAuth();
    return false;
  }
  try {
    const tokens = await postAuthRefresh(refreshToken);
    useAuthStore.getState().setCredentials({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    saveAuthTokens(tokens.accessToken, tokens.refreshToken);
    return true;
  } catch (error) {
    if (isRefreshRejected(error)) {
      useAuthStore.getState().clearAuth();
    }
    return false;
  }
};

/** Một phiên refresh dùng chung cho mọi request 401 đồng thời. */
export const refreshAccessTokenViaStore = (): Promise<boolean> => {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};
