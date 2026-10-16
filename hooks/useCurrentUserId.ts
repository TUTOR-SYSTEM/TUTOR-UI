"use client";

import { useMemo } from "react";

import { decodeJwtPayload } from "@/lib/auth/jwt-payload";
import { useAuthStore } from "@/zustand/auth.store";

/** Decodes the JWT access token and returns the user ID (sub claim), or null if not authenticated. */
export function useCurrentUserId(): string | null {
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.user?.role);
  return useMemo(() => {
    if (!accessToken || !role) return null;
    return decodeJwtPayload<{ sub?: string }>(accessToken)?.sub ?? null;
  }, [accessToken, role]);
}
