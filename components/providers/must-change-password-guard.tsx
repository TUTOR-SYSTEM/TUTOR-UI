"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth.provider";
import { useCurrentUserRoleOrNull } from "@/hooks/useCurrentUserRole";
import { ROLE_HOME } from "@/lib/rbac/roles";

export const CHANGE_PASSWORD_PATH = "/change-password";

/**
 * Buộc người dùng đổi mật khẩu trước khi dùng hệ thống khi `user.mustChangePassword` = true
 * (tài khoản học sinh/gia sư do admin/gia sư tạo, hoặc mật khẩu vừa được đặt lại). Mọi route trong
 * `(app)` đều được chuyển về `/change-password`; trang đó vẫn mở để đăng xuất được qua header.
 * Chỉ là chặn phía client — BE vẫn là nguồn quyết định cuối cùng.
 */
export function MustChangePasswordGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const role = useCurrentUserRoleOrNull();

  const onChangePage = pathname === CHANGE_PASSWORD_PATH;
  const mustChange = isAuthenticated && user?.mustChangePassword === true;
  const blocked = mustChange && !onChangePage;

  useEffect(() => {
    if (!isAuthenticated) return;
    if (blocked) {
      router.replace(CHANGE_PASSWORD_PATH);
    } else if (!mustChange && onChangePage && role) {
      // Đã đổi xong (hoặc không cần đổi): không ở lại trang đổi mật khẩu.
      router.replace(ROLE_HOME[role]);
    }
  }, [isAuthenticated, blocked, mustChange, onChangePage, role, router]);

  if (blocked) {
    return (
      <div
        className="flex min-h-[60vh] w-full items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Redirecting…</span>
        <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
