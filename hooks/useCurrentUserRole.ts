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
 * Role của người dùng hiện tại, hoặc `null` khi chưa xác định được (chưa có token/profile). Dùng
 * cho quyết định chặn route (`RoleGuard`): không được mặc định thành một role có quyền.
 */
export function useCurrentUserRoleOrNull(): UserRole | null {
  const role = useAuthStore((s) => s.user?.role);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMemo(
    () => normalize(role) ?? roleFromToken(accessToken),
    [role, accessToken],
  );
}

/**
 * Role để hiển thị UI (label, menu). Khi chưa xác định, mặc định `TUTOR` như trước để giữ UX
 * quản lý. Đây chỉ là gợi ý giao diện — quyền thật do BE enforce, và việc chặn route dùng
 * `useCurrentUserRoleOrNull`.
 */
export function useCurrentUserRole(): UserRole {
  return useCurrentUserRoleOrNull() ?? "TUTOR";
}
