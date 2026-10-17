import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { ApiError, ApiErrorResponse } from "@/types";
import {
  refreshAccessTokenViaStore,
  type RefreshOutcome,
} from "@/lib/axios/refresh-access-token";
import { getAccessToken } from "@/lib/axios/auth-storage";
import { useAuthStore } from "@/zustand/auth.store";
import { useLocaleStore } from "@/zustand/locale.store";

export const normalizeResponseData = (
  data: unknown,
): ApiErrorResponse | undefined => {
  if (!data || typeof data !== "object") {
    return undefined;
  }
  return data as ApiErrorResponse;
};

/** Human-readable summary; full payload stays on `ApiError.data`. */
export const pickErrorMessage = (
  data: ApiErrorResponse | undefined,
  axiosMessage?: string,
): string => {
  if (data) {
    if (typeof data.message === "string" && data.message.length > 0) {
      return data.message;
    }
    if (Array.isArray(data.message)) {
      const parts = data.message.filter(
        (m): m is string => typeof m === "string" && m.length > 0,
      );
      if (parts.length > 0) {
        return parts.join("; ");
      }
    }
    if (typeof data.error === "string" && data.error.length > 0) {
      return data.error;
    }
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const parts = data.errors
        .map((e) => e.message)
        .filter((m): m is string => typeof m === "string" && m.length > 0);
      if (parts.length > 0) {
        return parts.join("; ");
      }
    }
  }
  if (axiosMessage && axiosMessage.length > 0) {
    return axiosMessage;
  }
  return "Unexpected network error";
};

export const toApiError = (error: AxiosError<ApiErrorResponse>): ApiError => {
  const statusCode = error.response?.status;
  const data = normalizeResponseData(error.response?.data);
  const message = pickErrorMessage(data, error.message);
  return new ApiError(message, statusCode, data);
};

type RequestConfig401 = InternalAxiosRequestConfig & {
  skip401Refresh?: boolean;
  _retry401?: boolean;
};

export const requestUrlKey = (config: InternalAxiosRequestConfig): string => {
  const base = (config.baseURL ?? "").replace(/\/$/, "");

  const path = String(config.url ?? "")
    .replace(/^\//, "")
    .replace(/\/$/, "");

  return `${base}/${path}`.toLowerCase();
};

export const shouldSkip401Refresh = (
  config: InternalAxiosRequestConfig,
): boolean => {
  const c = config as RequestConfig401;
  if (c.skip401Refresh) {
    return true;
  }
  const key = requestUrlKey(config);
  return (
    key.includes("/auth/login") ||
    key.includes("/auth/register") ||
    key.includes("/auth/forgot-password") ||
    key.includes("/auth/reset-password") ||
    key.includes("/auth/verify-email")
  );
};

export const redirectToLogin = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  if (window.location.pathname.startsWith("/login")) {
    return;
  }
  window.location.assign("/login");
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8888";

/** `withCredentials`: refresh token là cookie httpOnly của gateway (`/auth/refresh`, `/auth/logout`). */
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const bearerOf = (header: unknown): string => {
  const value = typeof header === "string" ? header : "";
  return value.startsWith("Bearer ") ? value.slice("Bearer ".length) : "";
};

axiosInstance.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = useAuthStore.getState().accessToken || getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["Accept-Language"] = useLocaleStore.getState().language;

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError<ApiErrorResponse>(error)) {
      if (error instanceof ApiError) {
        return Promise.reject(error);
      }
      if (error instanceof Error) {
        return Promise.reject(
          new ApiError(error.message || "Unexpected network error"),
        );
      }
      return Promise.reject(new ApiError("Unexpected network error"));
    }

    if (!error.config) {
      return Promise.reject(toApiError(error));
    }

    const config = error.config as RequestConfig401;
    const status = error.response?.status;

    if (
      status === 401 &&
      typeof window !== "undefined" &&
      !shouldSkip401Refresh(config)
    ) {
      if (config._retry401) {
        useAuthStore.getState().clearAuth();
        redirectToLogin();
        return Promise.reject(toApiError(error));
      }

      // Request này gửi bằng access token cũ mà store đã có token mới (một 401 khác vừa refresh
      // xong): retry ngay với token hiện tại, không gọi refresh lần nữa.
      const current = useAuthStore.getState().accessToken;
      const alreadyRotated =
        Boolean(current) && bearerOf(config.headers?.Authorization) !== current;

      let outcome: RefreshOutcome = "refreshed";
      if (!alreadyRotated) {
        outcome = await refreshAccessTokenViaStore();
      }
      if (outcome === "rejected") {
        redirectToLogin();
        return Promise.reject(
          new ApiError(
            "Session expired. Please sign in again.",
            401,
            normalizeResponseData(error.response?.data),
          ),
        );
      }
      if (outcome === "failed") {
        // Lỗi tạm thời khi refresh: giữ phiên. Không trả 401 để caller (vd AuthProvider) không
        // hiểu nhầm là phiên hết hạn và xóa token.
        return Promise.reject(
          new ApiError(
            "Could not refresh your session. Please try again.",
            undefined,
            normalizeResponseData(error.response?.data),
          ),
        );
      }

      const token = useAuthStore.getState().accessToken;
      config._retry401 = true;
      config.headers = config.headers ?? {};
      config.headers.Authorization = token ? `Bearer ${token}` : undefined;

      try {
        return await axiosInstance.request(config);
      } catch (retryErr) {
        if (axios.isAxiosError<ApiErrorResponse>(retryErr)) {
          return Promise.reject(toApiError(retryErr));
        }
        throw retryErr;
      }
    }

    return Promise.reject(toApiError(error));
  },
);
