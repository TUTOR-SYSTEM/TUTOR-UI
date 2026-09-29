import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { axiosInstance } from "@/lib/axios";

// ── Raw HTTP helpers ─────────────────────────────────────────────────────────

export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  const response = await axiosInstance.get<T>(url, { params });
  return response.data;
}

export async function apiPost<TData, TPayload = unknown>(
  url: string,
  payload: TPayload,
) {
  // A bare string payload is only ever a URL param (e.g. `/x/${id}/run`); sent as a JSON body it
  // would be `"<id>"`, which the gateway's strict body parser rejects with a 400.
  const body = typeof payload === "string" ? undefined : payload;
  const response = await axiosInstance.post<TData>(url, body);
  return response.data;
}

export async function apiPut<TData, TPayload = unknown>(
  url: string,
  payload: TPayload,
) {
  const response = await axiosInstance.put<TData>(url, payload);
  return response.data;
}

export async function apiPatch<TData, TPayload = unknown>(
  url: string,
  payload: TPayload,
) {
  const response = await axiosInstance.patch<TData>(url, payload);
  return response.data;
}

export async function apiDelete<TData>(url: string) {
  const response = await axiosInstance.delete<TData>(url);
  return response.data;
}

// ── Query hooks ──────────────────────────────────────────────────────────────

/**
 * GET request wrapped in useQuery.
 * TRaw = shape returned by the API; TData = shape after optional select (defaults to TRaw).
 */
export function useGet<TRaw = unknown, TData = TRaw>(
  queryKey: readonly unknown[],
  url: string,
  options?: {
    params?: Record<string, unknown>;
    select?: (data: TRaw) => TData;
  } & Omit<
    UseQueryOptions<TRaw, Error, TData, readonly unknown[]>,
    "queryKey" | "queryFn" | "select"
  >,
) {
  const { params, select, ...queryOptions } = options ?? {};
  return useQuery<TRaw, Error, TData>({
    queryKey,
    queryFn: () => apiGet<TRaw>(url, params),
    select,
    ...queryOptions,
  });
}

/**
 * POST request wrapped in useMutation.
 * url can be a static string or a fn(payload) => string for dynamic paths.
 */
export function usePost<TData, TPayload = unknown>(
  url: string | ((payload: TPayload) => string),
  options?: UseMutationOptions<TData, Error, TPayload>,
) {
  return useMutation<TData, Error, TPayload>({
    mutationFn: (payload) => {
      const resolvedUrl = typeof url === "function" ? url(payload) : url;
      return apiPost<TData, TPayload>(resolvedUrl, payload);
    },
    ...options,
  });
}

/**
 * PUT request wrapped in useMutation.
 * url can be a static string or a fn(payload) => string for dynamic paths.
 */
export function usePut<TData, TPayload = unknown>(
  url: string | ((payload: TPayload) => string),
  options?: UseMutationOptions<TData, Error, TPayload>,
) {
  return useMutation<TData, Error, TPayload>({
    mutationFn: (payload) => {
      const resolvedUrl = typeof url === "function" ? url(payload) : url;
      return apiPut<TData, TPayload>(resolvedUrl, payload);
    },
    ...options,
  });
}

/**
 * PATCH request wrapped in useMutation.
 * url can be a static string or a fn(payload) => string for dynamic paths.
 */
export function usePatch<TData, TPayload = unknown>(
  url: string | ((payload: TPayload) => string),
  options?: UseMutationOptions<TData, Error, TPayload>,
) {
  return useMutation<TData, Error, TPayload>({
    mutationFn: (payload) => {
      const resolvedUrl = typeof url === "function" ? url(payload) : url;
      return apiPatch<TData, TPayload>(resolvedUrl, payload);
    },
    ...options,
  });
}

/**
 * DELETE request wrapped in useMutation.
 * url can be a static string or a fn(payload) => string for dynamic paths.
 */
export function useDelete<TData, TPayload = string>(
  url: string | ((payload: TPayload) => string),
  options?: UseMutationOptions<TData, Error, TPayload>,
) {
  return useMutation<TData, Error, TPayload>({
    mutationFn: (payload) => {
      const resolvedUrl = typeof url === "function" ? url(payload) : url;
      return apiDelete<TData>(resolvedUrl);
    },
    ...options,
  });
}

// ── Backward-compatible aliases ──────────────────────────────────────────────

export const useApiQuery = useGet;
export const useApiMutation = usePost;
