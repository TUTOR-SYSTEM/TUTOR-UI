"use client";

import { useMemo } from "react";

import { decodeJwtPayload } from "@/lib/auth/jwt-payload";
import { useAuthStore } from "@/zustand/auth.store";

export type UserRole = "ADMIN" | "TUTOR" | "STUDENT" | "PARENT";

const ROLES: readonly UserRole[] = ["ADMIN", "TUTOR", "STUDENT", "PARENT"];

const normalize = (value?: string | null): UserRole | null => {
  if (!value) return null;
  const upper = value.toUpperCase();
  return (ROLES as readonly string[]).includes(upper)
    ? (upper as UserRole)
    : null;
};

/** Reads `role` from the JWT `role` claim (always present on access tokens). */
const roleFromToken = (accessToken: string | null): UserRole | null =>
  normalize(decodeJwtPayload<{ role?: string }>(accessToken)?.role);

/**
 * Current user's role. Prefers the profile loaded into the zustand auth store
 * (`/users/detail-user`), falling back to the JWT claim for the brief window
 * before it resolves. Defaults to `TUTOR` when nothing is available (preserves
 * the management UX).
 */
export function useCurrentUserRole(): UserRole {
  const role = useAuthStore((s) => s.user?.role);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMemo(
    () => normalize(role) ?? roleFromToken(accessToken) ?? "TUTOR",
    [role, accessToken],
  );
}
