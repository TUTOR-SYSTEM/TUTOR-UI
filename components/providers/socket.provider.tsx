"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/zustand/auth.store";
import { CHAT_AVAILABLE } from "@/lib/chat/availability";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
});

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8888";

export function SocketProvider({ children }: { children: ReactNode }) {
  // The token is a reactive dependency: a new socket is built when the access token changes
  // (login, refresh, logout) instead of reading the token once at mount. The socket is created
  // with autoConnect off and only connected inside the effect below.
  const accessToken = useAuthStore((s) => s.accessToken);
  const socket = useMemo<Socket | null>(() => {
    // Gateway does not proxy the `/chat` namespace yet (see lib/chat/availability.ts).
    if (!CHAT_AVAILABLE || !accessToken) return null;
    return io(`${SOCKET_URL}/chat`, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: false,
    });
  }, [accessToken]);

  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      console.log("[Socket] Connected:", socket.id);
    };
    const handleDisconnect = () => {
      setIsConnected(false);
      console.log("[Socket] Disconnected");
    };
    const handleUserStatus = (data: { userId: string; status: string }) => {
      setOnlineUsers((prev) => {
        const nextSet = new Set(prev);
        if (data.status === "online") {
          nextSet.add(data.userId);
        } else {
          nextSet.delete(data.userId);
        }
        return nextSet;
      });
    };
    const handleConnectError = (error: Error) => {
      console.error("[Socket] Connection error:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("user:status", handleUserStatus);
    socket.on("connect_error", handleConnectError);
    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("user:status", handleUserStatus);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
      setIsConnected(false);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
