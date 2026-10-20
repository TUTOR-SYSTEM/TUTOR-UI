"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useCurrentUserRoleOrNull } from "@/hooks/useCurrentUserRole";
import { ROLE_HOME, isRoleAllowed, type UserRole } from "@/lib/rbac/roles";

/**
 * Chặn truy cập route theo role. Bọc ở `layout.tsx` của từng route-group role
 * (`(admin)`, `(tutor)`, `(student)`, `(parent)`).
 *
 * - Nếu role hiện tại nằm trong `allow` → render children.
 * - Nếu không → điều hướng về trang chủ của role đó (`ROLE_HOME`) và hiển thị
 *   spinner trong lúc chuyển trang, tránh nháy nội dung không được phép.
 *
 * Xác thực (có token hay chưa) do `AuthGuard` xử lý ở tầng shell — RoleGuard chỉ
 * lo phân quyền.
 */
export function RoleGuard({
  allow,
  children,
}: {
  allow: readonly UserRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  // Role chưa xác định (null) thì KHÔNG cho vào: không mặc định thành role có quyền.
  const role = useCurrentUserRoleOrNull();
  const allowed = role !== null && isRoleAllowed(role, allow);

  useEffect(() => {
    if (role !== null && !isRoleAllowed(role, allow)) {
      router.replace(ROLE_HOME[role]);
    }
  }, [allow, role, router]);

  if (!allowed) {
    return (
      <div
        className="flex min-h-[60vh] w-full items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Đang kiểm tra quyền truy cập…</span>
        <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
