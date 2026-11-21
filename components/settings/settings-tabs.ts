import type { UserRole } from "@/lib/rbac/roles";
import type { ElementType } from "react";
import { Bell, CreditCard, GraduationCap, Lock, Palette, User } from "lucide-react";

/* ─── Types ─── */
export type Tab =
  | "profile"
  | "security"
  | "notifications"
  | "appearance"
  | "classes"
  | "fees";


/* ─── Tab config (label/desc nằm trong settings.dictionary.ts) ─── */
export const TABS: { id: Tab; icon: ElementType }[] = [
  { id: "profile", icon: User },
  { id: "security", icon: Lock },
  { id: "notifications", icon: Bell },
  { id: "appearance", icon: Palette },
  { id: "classes", icon: GraduationCap },
  { id: "fees", icon: CreditCard },
];


/**
 * Tab nào role nào được xem — `null` = mọi role đã đăng nhập. SSOT ngay tại
 * đây (không tách route riêng) vì `/settings` là route dùng chung, khớp tinh
 * thần bảng `ROUTE_ACCESS` (`@/lib/rbac/route-access`). "Lớp học" và "Học phí"
 * là cài đặt công việc dạy — chỉ TUTOR mới cấu hình, ADMIN/STUDENT/PARENT
 * không có gì để cấu hình ở hai tab này.
 */
export const TAB_ACCESS: Record<Tab, readonly UserRole[] | null> = {
  profile: null,
  security: null,
  notifications: null,
  appearance: null,
  classes: ["TUTOR"],
  fees: ["TUTOR"],
};
