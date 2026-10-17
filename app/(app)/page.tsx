"use client";

import Link from "next/link";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Users,
  Wallet,
} from "lucide-react";

import { useDashboardActions } from "@/lib/services/dashboard.service";
import { useCurrentUserRole } from "@/hooks";
import { useDashboardCopy } from "@/hooks/useDashboardCopy.hook";
import type { DashboardDictionary } from "@/lib/i18n/dashboard.dictionary";
import type {
  DashboardMonthly,
  DashboardNotification,
  DashboardNotificationType,
  DashboardScheduleItem,
  DashboardStats,
} from "@/types";
import { safeRedirectHref } from "@/lib/notification-redirect";

/* ─── helpers ─── */
function getGreeting(labels: DashboardDictionary["greeting"]) {
  const h = new Date().getHours();
  if (h < 12) return labels.morning;
  if (h < 18) return labels.afternoon;
  return labels.evening;
}

function formatMillions(n: number, suffix: string) {
  return `${(n / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}${suffix}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatMode(format: string, labels: DashboardDictionary["schedule"]) {
  return format === "ONLINE" ? labels.online : labels.offline;
}

const modeBadge = (format: string) =>
  format === "ONLINE"
    ? "bg-[#E4F6EF] text-[#0B7A6D]"
    : "bg-[#FFF0E6] text-[#E85D24]";

type StatCard = {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  up?: boolean | null;
  icon: React.ElementType;
  accent?: boolean;
};

function buildStats(
  stats: DashboardStats,
  isStudent: boolean,
  copy: DashboardDictionary,
): StatCard[] {
  if (isStudent) {
    return [
      {
        label: copy.stats.classesLearning,
        value: String(stats.classesCount),
        icon: BookOpen,
      },
      {
        label: copy.stats.sessionsThisWeek,
        value: String(stats.sessionsThisWeek),
        sub: `${stats.sessionsCompletedThisWeek} ${copy.stats.completedSuffix}`,
        icon: CalendarDays,
      },
      {
        label: copy.stats.unpaidTuition,
        value: formatMillions(
          stats.unpaidTuitionAmount,
          copy.units.millionsSuffix,
        ),
        icon: Wallet,
        accent: true,
      },
      {
        label: copy.stats.overdueTuition,
        value: String(stats.overdueTuitionCount),
        sub:
          stats.overdueTuitionCount > 0
            ? copy.stats.overdueNeedsPayment
            : copy.stats.overdueNone,
        icon: AlertCircle,
      },
    ];
  }
  return [
    {
      label: copy.stats.classesTeaching,
      value: String(stats.classesCount),
      icon: BookOpen,
    },
    {
      label: copy.stats.studentsCount,
      value: String(stats.studentsCount),
      icon: Users,
    },
    {
      label: copy.stats.sessionsThisWeek,
      value: String(stats.sessionsThisWeek),
      sub: `${stats.sessionsCompletedThisWeek} ${copy.stats.completedSuffix}`,
      icon: CalendarDays,
    },
    {
      label: copy.stats.revenueThisMonth,
      value: formatMillions(stats.revenueThisMonth, copy.units.millionsSuffix),
      icon: Wallet,
      accent: true,
    },
  ];
}

/* ─── component ─── */
export default function HomePage() {
  const role = useCurrentUserRole();
  const isStudent = role === "STUDENT";
  const copy = useDashboardCopy();

  const { data, isLoading, isError } = useDashboardActions().overview;

  const today = new Date();
  const dayName = today.toLocaleDateString("vi-VN", { weekday: "long" });
  const dateStr = today.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const stats = data ? buildStats(data.stats, isStudent, copy) : [];
  const schedule = data?.todaySchedule ?? [];
  const notifications = data?.recentNotifications ?? [];
  const monthly = data?.monthly ?? [];

  const notiBadge: Record<
    DashboardNotificationType,
    { label: string; className: string }
  > = {
    SYSTEM: {
      label: copy.notifications.types.system,
      className: "bg-[#EEF2FF] text-[#2563EB]",
    },
    TUITION: {
      label: copy.notifications.types.tuition,
      className: "bg-[#FFF0E6] text-[#E85D24]",
    },
    STUDENT: {
      label: copy.notifications.types.student,
      className: "bg-[#E4F6EF] text-[#0B7A6D]",
    },
    TUTOR: {
      label: copy.notifications.types.tutor,
      className: "bg-[#F5F3FF] text-[#7C3AED]",
    },
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-sm"
        style={{
          background: "linear-gradient(135deg, #0E9F8E 0%, #15C2A8 100%)",
        }}
      >
        <div className="relative z-10">
          <p className="mb-1 text-sm font-medium opacity-80 capitalize">
            {dayName}, {dateStr}
          </p>
          <h2 className="text-2xl text-white font-bold">
            {getGreeting(copy.greeting)}!
          </h2>
          <p className="mt-1 text-sm opacity-80">
            {isLoading
              ? copy.banner.loading
              : schedule.length > 0
                ? `${copy.banner.hasSessionsPrefix} ${schedule.length} ${
                    isStudent
                      ? copy.banner.hasSessionsSuffixStudent
                      : copy.banner.hasSessionsSuffixTutor
                  }`
                : isStudent
                  ? copy.banner.noSessionsStudent
                  : copy.banner.noSessionsTutor}
          </p>
        </div>
        <span className="absolute -right-8 -top-8 size-40 rounded-full bg-white/10" />
        <span className="absolute -bottom-6 right-24 size-24 rounded-full bg-white/10" />
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {copy.overviewError}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-26 animate-pulse rounded-xl border border-[#E7EEEC] bg-[#F3F7F5]"
              />
            ))
          : stats.map((s) => (
              <div
                key={s.label}
                className={`rounded-xl border p-5 shadow-sm ${
                  s.accent
                    ? "border-[#0E9F8E]/20 bg-[#FFF0E6]"
                    : "border-[#E7EEEC] bg-white"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-[#8AA09B]">{s.label}</span>
                  <s.icon
                    className={`size-4 ${s.accent ? "text-[#E85D24]" : "text-[#9AAEA9]"}`}
                  />
                </div>
                <p
                  className={`text-2xl font-bold tracking-tight ${
                    s.accent ? "text-[#E85D24]" : "text-[#16302b]"
                  }`}
                >
                  {s.value}
                </p>
                <p
                  className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${
                    s.up === true
                      ? "text-[#0E9F8E]"
                      : s.up === false
                        ? "text-red-500"
                        : "text-[#8AA09B]"
                  }`}
                >
                  {s.up === true && <ArrowUpRight className="size-3.5" />}
                  {s.sub ?? s.trend ?? " "}
                </p>
              </div>
            ))}
      </div>

      {/* ── Two-column section ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        {/* Schedule table */}
        <div className="rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E7EEEC] px-5 py-4">
            <h3 className="font-semibold text-[#16302b]">
              {isStudent
                ? copy.schedule.titleStudent
                : copy.schedule.titleTutor}
            </h3>
            <Link
              href="/schedule"
              className="text-xs font-medium text-[#0E9F8E] hover:underline"
            >
              {copy.schedule.viewWeek}
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EEF3F1] text-xs text-[#9AAEA9]">
                <th className="px-5 py-2.5 text-left font-medium">
                  {copy.schedule.colTime}
                </th>
                <th className="px-3 py-2.5 text-left font-medium">
                  {copy.schedule.colClassSubject}
                </th>
                <th className="px-3 py-2.5 text-left font-medium">
                  {copy.schedule.colLocation}
                </th>
                <th className="px-5 py-2.5 text-left font-medium">
                  {copy.schedule.colFormat}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-[#9AAEA9]"
                  >
                    {copy.schedule.loading}
                  </td>
                </tr>
              ) : schedule.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-[#9AAEA9]"
                  >
                    {copy.schedule.emptyToday}
                  </td>
                </tr>
              ) : (
                schedule.map((row: DashboardScheduleItem) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#EEF3F1] last:border-0 hover:bg-[#F1FBF9] transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-[#16302b]">
                      {formatTime(row.startAt)}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-[#16302b]">
                        {row.className}
                      </p>
                      <p className="text-xs text-[#8AA09B]">
                        {row.title ?? row.subject}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-[#16302b]">
                      {row.location ??
                        (row.format === "ONLINE"
                          ? copy.schedule.onlineLocationFallback
                          : "—")}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${modeBadge(row.format)}`}
                      >
                        {formatMode(row.format, copy.schedule)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Notifications panel */}
        <div className="rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E7EEEC] px-5 py-4">
            <h3 className="font-semibold text-[#16302b]">
              {copy.notifications.title}
            </h3>
            <Link
              href="/notifications"
              className="text-xs font-medium text-[#0E9F8E] hover:underline"
            >
              {copy.notifications.viewAll}
            </Link>
          </div>
          <div className="divide-y divide-[#EEF3F1]">
            {isLoading ? (
              <div className="px-5 py-8 text-center text-sm text-[#9AAEA9]">
                {copy.notifications.loading}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[#9AAEA9]">
                {copy.notifications.empty}
              </div>
            ) : (
              notifications.map((n: DashboardNotification, i: number) => {
                const badge = notiBadge[n.type] ?? notiBadge.SYSTEM;
                return (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-5 py-3.5"
                  >
                    <span className="mt-0.5 w-5 shrink-0 text-xs text-[#9AAEA9]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="flex-1 text-sm leading-snug text-[#16302b]">
                      {n.title}
                      {" · "}
                      <Link
                        href={safeRedirectHref(n.redirectUrl) ?? "/notifications"}
                        className="font-medium text-[#0E9F8E] hover:underline"
                      >
                        {n.actionLabel || copy.notifications.detail}
                      </Link>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Revenue chart ── */}
      {!isStudent && (
        <div className="rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-[#EEF3F1] px-5 py-4">
            <div>
              <h3 className="font-semibold text-[#16302b]">
                {copy.revenueChart.titlePrefix} · {today.getFullYear()}
              </h3>
              <p className="mt-0.5 text-xs text-[#8AA09B]">
                {copy.revenueChart.totalYearPrefix}{" "}
                {formatMillions(
                  monthly.reduce((sum, m) => sum + m.revenue, 0),
                  copy.units.millionsSuffix,
                )}{" "}
                · {monthly.reduce((sum, m) => sum + m.sessions, 0)}{" "}
                {copy.revenueChart.sessionsSuffix}
              </p>
            </div>
            <div className="hidden items-center gap-5 text-xs text-[#8AA09B] sm:flex">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block size-2.5 rounded-sm"
                  style={{ background: "#0E9F8E" }}
                />
                {copy.revenueChart.revenueLegend}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-full bg-[#FF7A45]" />
                {copy.revenueChart.sessionsLegend}
              </span>
            </div>
          </div>
          <div className="px-5 py-5">
            {isLoading ? (
              <div className="h-34 animate-pulse rounded-lg bg-[#F3F7F5]" />
            ) : (
              <RevenueChart monthly={monthly} copy={copy} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RevenueChart({
  monthly,
  copy,
}: {
  monthly: DashboardMonthly[];
  copy: DashboardDictionary;
}) {
  const monthLabels = copy.revenueChart.monthLabels;
  const chartData =
    monthly.length > 0
      ? monthly.map((m) => ({
          label: monthLabels[m.month - 1] ?? `T${m.month}`,
          revenue: m.revenue,
          sessions: m.sessions,
        }))
      : Array.from({ length: 12 }, (_, i) => ({
          label: monthLabels[i],
          revenue: 0,
          sessions: 0,
        }));
  return (
    <ResponsiveContainer width="100%" height={160}>
      <ComposedChart
        data={chartData}
        margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#E7EEEC"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#9AAEA9" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 10, fill: "#9AAEA9" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) =>
            v >= 1e6
              ? `${(v / 1e6).toFixed(1)}${copy.units.millionsSuffix}`
              : v >= 1e3
                ? `${(v / 1e3).toFixed(0)}k`
                : String(v)
          }
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 10, fill: "#FF7A45" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v} ${copy.units.sessionsShort}`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #E7EEEC",
            background: "#fff",
            fontSize: 12,
          }}
          formatter={(value, name) =>
            name === "revenue"
              ? [
                  `${(Number(value) / 1e6).toFixed(1)}${copy.units.millionsSuffix}`,
                  copy.revenueChart.tooltipRevenue,
                ]
              : [String(value), copy.revenueChart.tooltipSessions]
          }
        />
        <Bar
          yAxisId="left"
          dataKey="revenue"
          fill="#0E9F8E"
          fillOpacity={0.85}
          radius={[3, 3, 0, 0]}
          barSize={14}
          name="revenue"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="sessions"
          stroke="#FF7A45"
          strokeWidth={2}
          dot={{ r: 3, fill: "#FF7A45", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#FF7A45", strokeWidth: 2, stroke: "#fff" }}
          name="sessions"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
