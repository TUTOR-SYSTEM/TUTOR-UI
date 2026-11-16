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


/* ─── Tab config ─── */
export const TABS: {
  id: Tab;
  label: string;
  icon: ElementType;
  desc: string;
}[] = [
  {
    id: "profile",
    label: "Hồ sơ cá nhân",
    icon: User,
    desc: "Thông tin và ảnh đại diện",
  },
  {
    id: "security",
    label: "Bảo mật",
    icon: Lock,
    desc: "Mật khẩu và xác thực",
  },
  {
    id: "notifications",
    label: "Thông báo",
    icon: Bell,
    desc: "Tuỳ chọn nhận thông báo",
  },
  {
    id: "appearance",
    label: "Giao diện & Ngôn ngữ",
    icon: Palette,
    desc: "Tuỳ chỉnh cách bảng điều khiển hiển thị.",
  },
  {
    id: "classes",
    label: "Giảng dạy",
    icon: GraduationCap,
    desc: "Thiết lập mặc định áp dụng khi tạo buổi học và lớp mới.",
  },
  {
    id: "fees",
    label: "Thanh toán",
    icon: CreditCard,
    desc: "Tài khoản nhận học phí từ phụ huynh.",
  },
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
