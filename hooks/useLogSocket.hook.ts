"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/zustand/auth.store";
import type { ApiRequestLog } from "@/types";

/**
 * THIRD_SERVICE owns `request_logs` (and the `/logs` socket namespace that broadcasts new rows)
 * on its own port — unlike REST calls, sockets aren't proxied through the gateway. Defaults to
 * THIRD_SERVICE's local dev port (`4000`, see `THIRD_SERVICE/.env`).
 */
const LOG_SOCKET_URL =
  process.env.NEXT_PUBLIC_THIRD_SERVICE_URL?.trim() || "http://localhost:4000";

type UseLogSocketOptions = {
  /** Only connect while the "Giám sát Request" page is mounted — this is an admin-only, on-demand
   * feed, not something every session should hold a socket open for. */
  enabled?: boolean;
  onNewLog?: (row: ApiRequestLog) => void;
};

export function useLogSocket({ enabled = true, onNewLog }: UseLogSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const onNewLogRef = useRef(onNewLog);

  useEffect(() => {
    onNewLogRef.current = onNewLog;
  }, [onNewLog]);

  useEffect(() => {
    if (!enabled) return;
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const socket: Socket = io(`${LOG_SOCKET_URL}/logs`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("log:new", (row: ApiRequestLog) => onNewLogRef.current?.(row));
    socket.on("connect_error", (error: Error) => {
      console.error("[LogSocket] Connection error:", error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled]);

  return { isConnected };
}
