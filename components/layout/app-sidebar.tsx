"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  BookText,
  CreditCard,
  GraduationCap,
  LogOut,
  Users,
  UserCog,
  LayoutGrid,
  CalendarDays,
  MessageSquare,
  Settings,
  Sparkles,
  GitBranch,
  ScrollText,
} from "lucide-react";

import { SidebarProvider } from "@/components/ui/sidebar.ui";
import { useAuthStore } from "@/zustand/auth.store";
import { useCurrentUserRole, type UserRole } from "@/hooks/useCurrentUserRole";
import { useAuth } from "@/components/providers/auth.provider";
import { useAppShellCopy } from "@/hooks/useAppShellCopy.hook";
import type { AppShellDictionary } from "@/lib/i18n/app-shell.dictionary";
import MenuPopover from "@/components/ui/menu-popover.ui";
import Image from "next/image";

type NavItem = {
  key: keyof AppShellDictionary["nav"];
  url: string;
  icon: React.ElementType;
  badge?: number;
};

/** Registry of every navigation destination, referenced by role menus below. */
const NAV = {
  overview: { key: "overview", url: "/", icon: LayoutGrid },
  schedule: { key: "schedule", url: "/schedule", icon: CalendarDays },
  notifications: {
    key: "notifications",
    url: "/notifications",
    icon: Bell,
    badge: 5,
  },
  classes: { key: "classes", url: "/classes", icon: BookOpen },
  curriculum: { key: "curriculum", url: "/curriculum", icon: BookText },
  grades: { key: "grades", url: "/grades", icon: Award },
  tutors: { key: "tutors", url: "/tutors", icon: GraduationCap },
  students: { key: "students", url: "/students", icon: Users },
  fees: { key: "fees", url: "/fees", icon: CreditCard },
  discussions: { key: "discussions", url: "/discussions", icon: MessageSquare },
  aiChat: { key: "aiChat", url: "/ai-chat", icon: Sparkles },
  users: { key: "users", url: "/users", icon: UserCog },
  reports: { key: "reports", url: "/reports", icon: BarChart3 },
  flowRequests: { key: "flowRequests", url: "/flow-requests", icon: GitBranch },
  logger: { key: "logger", url: "/logger", icon: ScrollText },
} satisfies Record<string, NavItem>;

/**
 * Menu items per role. Ordering here is the display order.
 * Visibility follows the RBAC table (❌ = hidden, 👀 = view-only but still shown).
 */
const roleNav: Record<UserRole, NavItem[]> = {
  // Tutor — full access to every item.
  TUTOR: [
    NAV.overview,
    NAV.schedule,
    NAV.notifications,
    NAV.classes,
    NAV.curriculum,
    NAV.grades,
    NAV.students, // Tutor/Admin only
    NAV.fees, // 👀 view-only for Tutor
    NAV.discussions,
    NAV.aiChat,
  ],
  // Admin — trimmed menu: Overview, Tutors, Students.
  // (Settings is appended for every role via `navSettings`.)
  ADMIN: [NAV.overview, NAV.tutors, NAV.students, NAV.flowRequests, NAV.logger],
  // Student — no "Students"; "Tuition" is view-only.
  STUDENT: [
    NAV.overview,
    NAV.schedule,
    NAV.notifications,
    NAV.classes,
    NAV.grades,
    NAV.discussions,
    NAV.aiChat,
  ],
  // Parent — hides "Sessions" and "Students"; "Curriculum" shows progress only.
  PARENT: [
    NAV.overview,
    NAV.schedule,
    NAV.notifications,
    NAV.classes,
    { ...NAV.curriculum, key: "curriculumOfChild" },
    { ...NAV.grades, key: "gradesOfChild" },
    NAV.fees,
    NAV.discussions,
    NAV.aiChat,
  ],
};

const navSettings: NavItem[] = [
  { key: "settings", url: "/settings", icon: Settings },
];

const isItemActive = (url: string, pathname: string) =>
  url === "/"
    ? pathname === "/"
    : pathname === url || pathname.startsWith(`${url}/`);

function getInitials(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const f = firstName?.charAt(0) ?? "";
  const l = lastName?.charAt(0) ?? "";
  return (f + l).toUpperCase() || "U";
}

function getDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string,
): string {
  return [firstName, lastName].filter(Boolean).join(" ") || fallback || "";
}

const AVATAR_GRADIENTS = [
  "from-[#ffb877] to-[#ff7a45]",
  "from-[#12b3a0] to-[#0e9f8e]",
  "from-[#a78bfa] to-[#7c3aed]",
  "from-[#60a5fa] to-[#2563eb]",
  "from-[#f472b6] to-[#ec4899]",
];

function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

const AppSidebar = () => {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const role = useCurrentUserRole();
  const { brand, nav, roleLabels, userMenu } = useAppShellCopy();

  const mainItems: NavItem[] = roleNav[role];

  const renderNavItem = (item: NavItem) => {
    const active = isItemActive(item.url, pathname);
    return (
      <Link
        key={item.url}
        href={item.url}
        className={`flex h-10 w-full items-center gap-3 rounded-lg px-3.25 text-sm font-medium transition-colors ${
          active
            ? "bg-[#0e9f8e] text-white font-semibold"
            : "text-[#5c726d] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
      >
        <item.icon className="size-4.5 shrink-0" strokeWidth={1.8} />
        {nav[item.key]}
        {"badge" in item && item.badge ? (
          <span className="ml-auto rounded-[9px] bg-[#ff7a45] px-1.75 py-px text-[11px] font-bold text-white">
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
  };

  const initials = getInitials(user?.firstName, user?.lastName);
  const displayName = getDisplayName(
    user?.firstName,
    user?.lastName,
    userMenu.defaultName,
  );
  const gradientIndex = stringToHash(displayName) % AVATAR_GRADIENTS.length;
  const gradientClass = AVATAR_GRADIENTS[gradientIndex];
  const router = useRouter();
  const { setAccessToken } = useAuth();

  const signOut = () => {
    setAccessToken(null);
    router.push("/login");
  };

  return (
    <SidebarProvider>
      {/* Header */}
      <div className="flex items-center gap-2.75 px-6 pt-6 pb-4">
        <div className="flex size-9.5 shrink-0 items-center justify-center rounded-[11px] bg-linear-to-br from-[#12b3a0] to-[#0e9f8e] text-[18px] font-extrabold text-white">
          G
        </div>
        <div>
          <div
            className="mt-0.5 font-sans text-base font-bold leading-none text-[#16302b]"
            style={{ letterSpacing: "0.264px" }}
          >
            {brand.name}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {brand.tagline}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.75 overflow-y-auto px-4 pt-3">
        {mainItems.map(renderNavItem)}
        {navSettings.map(renderNavItem)}
      </nav>

      {/* User profile with popover */}
      <div className="px-4 pb-6 pt-4">
        <MenuPopover
          trigger={
            <div className="flex cursor-pointer items-center gap-2.75 rounded-[14px] bg-muted/50 p-3">
              {user?.avatar ? (
                <Image
                  width={40}
                  height={40}
                  src={user.avatar}
                  alt={displayName}
                  className="size-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${gradientClass} text-sm font-bold text-white`}
                >
                  {initials}
                </div>
              )}
              <div className="min-w-0 leading-[1.2]">
                <div className="truncate text-[13px] font-bold text-foreground">
                  {displayName}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {(role === "TUTOR" && user?.subjects) || roleLabels[role]}
                </div>
              </div>
            </div>
          }
          align="start"
          side="top"
        >
          <Link
            href="/settings"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Settings className="size-4" />
            {userMenu.settings}
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <LogOut className="size-4" />
            {userMenu.signOut}
          </button>
        </MenuPopover>
      </div>
    </SidebarProvider>
  );
};

export default AppSidebar;
