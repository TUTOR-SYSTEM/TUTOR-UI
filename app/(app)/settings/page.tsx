"use client";

import { Button } from "@/components/ui/button.ui";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { apiGet } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useAuthStore } from "@/zustand/auth.store";
import type { ApiUser } from "@/types";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { TABS, TAB_ACCESS, type Tab } from "@/components/settings/settings-tabs";
import { ProfilePanel } from "@/components/settings/profile-panel";
import { SecurityPanel } from "@/components/settings/security-panel";
import { NotificationsPanel } from "@/components/settings/notifications-panel";
import { AppearancePanel } from "@/components/settings/appearance-panel";
import { ClassesPanel } from "@/components/settings/classes-panel";
import { FeesPanel } from "@/components/settings/fees-panel";

const PANELS: Record<Tab, React.ReactNode> = {
  profile: <ProfilePanel />,
  security: <SecurityPanel />,
  notifications: <NotificationsPanel />,
  appearance: <AppearancePanel />,
  classes: <ClassesPanel />,
  fees: <FeesPanel />,
};


/* ─── Page ─── */
export default function SettingsPage() {
  const setUser = useAuthStore((s) => s.setUser);
  const role = useCurrentUserRole();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const visibleTabs = useMemo(
    () =>
      TABS.filter((tab) => {
        const allow = TAB_ACCESS[tab.id];
        return allow === null || allow.includes(role);
      }),
    [role],
  );

  useEffect(() => {
    let cancelled = false;
    const fetchUser = async () => {
      try {
        const raw = await apiGet<unknown>("/users/detail-user");
        const user = unwrapApiData<ApiUser>(raw);
        if (!cancelled) {
          setUser(user);
        }
      } catch {
        /* silent */
      }
    };
    fetchUser();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  // Tab đang chọn có thể bị ẩn theo role (đổi role, hoặc role vừa mới resolve
  // xong) — suy ra tab hiển thị thực tế ngay trong render thay vì setState
  // trong effect (tránh cascading render), rơi về tab đầu tiên còn hiển thị.
  const effectiveTab: Tab = visibleTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : (visibleTabs[0]?.id ?? "profile");

  return (
    <div className="flex gap-6 min-h-full">
      {/* Sidebar nav */}
      <aside className="w-56 shrink-0">
        <nav className="flex flex-col gap-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = effectiveTab === tab.id;
            return (
              <Button variant="ghost"
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex h-auto! w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-left font-normal text-sm transition-colors ${
                  active
                    ? "bg-primary text-white hover:bg-primary hover:text-white"
                    : "text-muted-foreground hover:bg-primary-soft hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.8} />
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${active ? "text-white" : ""}`}
                  >
                    {tab.label}
                  </p>
                  <p
                    className={`text-[11px] truncate ${active ? "text-white/70" : "text-muted-foreground"}`}
                  >
                    {tab.desc}
                  </p>
                </div>
                {!active && (
                  <ChevronRight className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                )}
              </Button>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* Panel header */}
          <div className="mb-6 border-b border-border-light pb-5">
            {(() => {
              const tab =
                visibleTabs.find((t) => t.id === effectiveTab) ??
                visibleTabs[0];
              if (!tab) return null;
              const Icon = tab.icon;
              // TUTOR sees a role-specific subtitle on the profile tab (this
              // info is visible to their students/parents) — every other
              // tab/role keeps the generic desc from TABS.
              const desc =
                tab.id === "profile" && role === "TUTOR"
                  ? "Thông tin này hiển thị với phụ huynh và học sinh của bạn."
                  : tab.desc;
              return (
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary-light">
                    <Icon
                      className="size-4.5 text-primary"
                      strokeWidth={1.8}
                    />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      {tab.label}
                    </h2>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Panel body */}
          {PANELS[effectiveTab]}
        </div>
      </div>
    </div>
  );
}
