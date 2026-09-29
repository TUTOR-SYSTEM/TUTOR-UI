"use client";

import { useEffect, useState } from "react";

/** Nhịp giữa hai bước phát lại — đủ chậm để mắt theo được từng service. */
export const PLAYBACK_STEP_MS = 380;

type PlaybackState = { key: string; visible: number; times: number[] };

/**
 * Lộ dần `total` mục (dòng LIVE TRACE) của một lần chạy, mỗi `PLAYBACK_STEP_MS` một mục, khi
 * `active`. Mục đầu (gửi request) luôn có sẵn. `resetKey` đổi (chạy lại / chạy request khác) thì
 * đếm lại từ đầu. `times[i - 1]` là `Date.now()` lúc mục thứ `i` hiện ra.
 */
export function useTracePlayback({
  total,
  active,
  resetKey,
}: {
  total: number;
  active: boolean;
  resetKey: string;
}) {
  const [state, setState] = useState<PlaybackState>({ key: resetKey, visible: 1, times: [] });
  const current = state.key === resetKey ? state : { key: resetKey, visible: 1, times: [] };

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setState((prev) => {
        const base = prev.key === resetKey ? prev : { key: resetKey, visible: 1, times: [] };
        if (base.visible >= total) return base === prev ? prev : base;
        return { key: resetKey, visible: base.visible + 1, times: [...base.times, Date.now()] };
      });
    }, PLAYBACK_STEP_MS);
    return () => clearInterval(timer);
  }, [active, total, resetKey]);

  const visible = Math.min(current.visible, Math.max(1, total));
  return { visible, times: current.times, playing: active && visible < total };
}
