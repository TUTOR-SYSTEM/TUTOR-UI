import type { UserRole } from "./roles";

type RouteAccessRule = {
  /** Prefix URL (không kèm query). Route con kế thừa quyền của route cha. */
  prefix: string;
  /** Các role được phép truy cập prefix này. */
  allow: readonly UserRole[];
};

/**
 * Bảng phân quyền route dùng chung — **single source of truth** cho `RouteAccessGuard`.
 * Giữ khớp với bảng menu theo role trong `components/layout/app-sidebar.tsx`
 * (một mục hiện trong sidebar của role nào thì role đó phải có quyền vào route đó).
 *
 * Quy tắc khớp: chọn prefix **khớp dài nhất** với pathname (khớp theo ranh giới
 * segment, không khớp lem sang tên khác). Route KHÔNG khai báo ở đây → mặc định
 * cho **mọi role đã đăng nhập** (vd `/`, `/settings`, và các trang legacy).
 *
 * Lưu ý: ADMIN cố tình KHÔNG có trong nhiều route nghiệp vụ (classes, sessions…)
 * vì menu ADMIN chỉ gồm Tổng quan / Gia sư / Học sinh.
 */
export const ROUTE_ACCESS: readonly RouteAccessRule[] = [
  { prefix: "/tutors", allow: ["ADMIN"] },
  { prefix: "/users", allow: ["ADMIN"] },
  { prefix: "/logger", allow: ["ADMIN"] },
  { prefix: "/students", allow: ["ADMIN", "TUTOR"] },
  { prefix: "/sessions", allow: ["TUTOR", "STUDENT"] },
  { prefix: "/curriculum", allow: ["TUTOR", "PARENT"] },
  { prefix: "/schedule", allow: ["TUTOR", "STUDENT", "PARENT"] },
  { prefix: "/classes", allow: ["TUTOR", "STUDENT", "PARENT"] },
  { prefix: "/grades", allow: ["TUTOR", "STUDENT", "PARENT"] },
  { prefix: "/fees", allow: ["TUTOR", "STUDENT", "PARENT"] },
  { prefix: "/discussions", allow: ["TUTOR", "STUDENT", "PARENT"] },
  { prefix: "/notifications", allow: ["TUTOR", "STUDENT", "PARENT"] },
  { prefix: "/ai-chat", allow: ["TUTOR", "STUDENT", "PARENT"] },
] as const;

const matchesPrefix = (pathname: string, prefix: string): boolean =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/**
 * Trả về danh sách role được phép cho `pathname`, hoặc `null` khi route không bị
 * giới hạn (mọi role đã đăng nhập đều vào được). Ưu tiên prefix khớp dài nhất.
 */
export function getRouteAccess(pathname: string): readonly UserRole[] | null {
  let best: RouteAccessRule | null = null;
  for (const rule of ROUTE_ACCESS) {
    if (
      matchesPrefix(pathname, rule.prefix) &&
      (best === null || rule.prefix.length > best.prefix.length)
    ) {
      best = rule;
    }
  }
  return best?.allow ?? null;
}
