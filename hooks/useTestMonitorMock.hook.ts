"use client";

import { useSyncExternalStore } from "react";

const envMock = () => process.env.NEXT_PUBLIC_TEST_MONITOR_MOCK === "true";

const subscribe = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
};

const getSnapshot = () => envMock() || new URLSearchParams(window.location.search).get("mock") === "1";

/** Chế độ dữ liệu DEMO của `/test-monitor`: bật khi URL có `?mock=1` hoặc env
 * `NEXT_PUBLIC_TEST_MONITOR_MOCK=true`. Đọc `window.location` trực tiếp (không `useSearchParams`)
 * để khỏi cần Suspense boundary. */
export function useTestMonitorMock(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, envMock);
}
