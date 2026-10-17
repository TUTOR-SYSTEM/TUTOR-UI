import axios from "axios";

import { postAuthRefresh } from "@/lib/axios/auth-refresh";
import { useAuthStore } from "@/zustand/auth.store";

/**
 * - `refreshed`: access token mới đã được lưu.
 * - `rejected`: refresh token bị từ chối (400/401/403 hoặc không hợp lệ) — phiên đã bị xóa.
 * - `failed`: lỗi tạm thời (mạng, 5xx, timeout) — giữ nguyên phiên, thử lại sau.
 */
export type RefreshOutcome = "refreshed" | "rejected" | "failed";

let refreshInFlight: Promise<RefreshOutcome> | null = null;

const isRefreshRejected = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 400 || status === 401 || status === 403;
};

export const performRefresh = async (): Promise<RefreshOutcome> => {
  try {
    const tokens = await postAuthRefresh();
    useAuthStore.getState().setCredentials({ accessToken: tokens.accessToken });
    return "refreshed";
  } catch (error) {
    if (isRefreshRejected(error)) {
      useAuthStore.getState().clearAuth();
      return "rejected";
    }
    return "failed";
  }
};

/** Một phiên refresh dùng chung cho mọi request 401 đồng thời. */
export const refreshAccessTokenViaStore = (): Promise<RefreshOutcome> => {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};
