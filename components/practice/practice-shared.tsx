"use client";

/**
 * Shared building blocks + mock data for the role-based "Bài tập & Học phí"
 * portal views (student / parent / tutor). Everything here is presentational
 * with placeholder data — swap the MOCK_* objects for real API calls later.
 */

import type { ElementType } from "react";
import { cn } from "@/lib/utils";

/* ─── Domain types (mock) ─────────────────────────────────── */

export type PracticeStatus =
  | "GRADED" // đã có điểm
  | "SUBMITTED" // đã nộp · chờ chấm
  | "NOT_SUBMITTED"; // chưa nộp

export type Assignment = {
  id: string;
  title: string;
  sessionNumber: number;
  sessionDate: string; // dd/mm
  description: string;
  dueLabel: string; // "12/07 · 23:59"
  status: PracticeStatus;
  score: number | null; // /10 when graded
};

export type TutorAssignment = {
  id: string;
  title: string;
  sessionNumber: number;
  sessionDate: string; // dd/mm/yyyy
  dueLabel: string; // "12/07"
  dueBadge: { text: string; tone: "soon" | "over" };
  submitted: number;
  total: number;
  state: "collecting" | "done"; // Đang thu bài / Đã chấm xong
};

/* ─── Mock data ───────────────────────────────────────────── */

export const MOCK_CHILD = {
  name: "Trần Bảo Long",
  initial: "L",
  className: "Lớp Toán 12A1",
  tutorName: "Thầy Minh Quân",
  avgScore: 7.8,
};

export const MOCK_CLASS = {
  name: "Lớp Toán 12A1",
  studentCount: 24,
  avgScore: 8.3,
};

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: "a12",
    title: "Bài tập Đạo hàm — Buổi 12",
    sessionNumber: 12,
    sessionDate: "12/07",
    description:
      "6 bài về quy tắc tính đạo hàm và đạo hàm hàm hợp. Chụp ảnh bài làm rồi nộp.",
    dueLabel: "12/07 · 23:59",
    status: "SUBMITTED",
    score: null,
  },
  {
    id: "a11",
    title: "Ôn tập Giới hạn — Buổi 11",
    sessionNumber: 11,
    sessionDate: "28/06",
    description: "Bài tập giới hạn hàm số và giới hạn một bên.",
    dueLabel: "28/06 · 23:59",
    status: "GRADED",
    score: 8.5,
  },
  {
    id: "a10",
    title: "Hàm số liên tục — Buổi 10",
    sessionNumber: 10,
    sessionDate: "21/06",
    description: "Xét tính liên tục của hàm số tại một điểm và trên khoảng.",
    dueLabel: "21/06 · 23:59",
    status: "GRADED",
    score: 7.0,
  },
  {
    id: "a13",
    title: "Đạo hàm cấp cao — Buổi 13",
    sessionNumber: 13,
    sessionDate: "15/07",
    description: "Sắp giao — tính đạo hàm cấp 2, cấp 3 và ứng dụng.",
    dueLabel: "15/07 · 23:59",
    status: "NOT_SUBMITTED",
    score: null,
  },
];

export const MOCK_TUTOR_ASSIGNMENTS: TutorAssignment[] = [
  {
    id: "t12a",
    title: "Bài tập Đạo hàm — Buổi 12",
    sessionNumber: 12,
    sessionDate: "05/07/2026",
    dueLabel: "12/07",
    dueBadge: { text: "Còn 5 ngày", tone: "soon" },
    submitted: 5,
    total: 8,
    state: "collecting",
  },
  {
    id: "t12b",
    title: "Trắc nghiệm nhanh — Đạo hàm cơ bản",
    sessionNumber: 12,
    sessionDate: "05/07/2026",
    dueLabel: "08/07",
    dueBadge: { text: "Còn 1 ngày", tone: "soon" },
    submitted: 7,
    total: 8,
    state: "collecting",
  },
  {
    id: "t11a",
    title: "Ôn tập Giới hạn — Buổi 11",
    sessionNumber: 11,
    sessionDate: "28/06/2026",
    dueLabel: "28/06",
    dueBadge: { text: "Đã hết hạn", tone: "over" },
    submitted: 8,
    total: 8,
    state: "done",
  },
  {
    id: "t11b",
    title: "Bài tập Giới hạn một bên",
    sessionNumber: 11,
    sessionDate: "28/06/2026",
    dueLabel: "26/06",
    dueBadge: { text: "Đã hết hạn", tone: "over" },
    submitted: 8,
    total: 8,
    state: "done",
  },
];

/* ─── Status metadata ─────────────────────────────────────── */

export const PRACTICE_STATUS: Record<
  PracticeStatus,
  { label: string; badge: string; bar: string }
> = {
  GRADED: {
    label: "Đã có điểm",
    badge: "bg-[#EEF0FF] dark:bg-[#6366F1]/15 text-[#4f46e5] dark:text-[#A5B4FC]",
    bar: "bg-[#6366F1]",
  },
  SUBMITTED: {
    label: "Đã nộp · chờ chấm",
    badge: "bg-[#E4F6EF] dark:bg-primary-light text-[#0B7A6D] dark:text-[#5EEAD4]",
    bar: "bg-[#0E9F8E]",
  },
  NOT_SUBMITTED: {
    label: "Chưa nộp",
    badge: "bg-[#FFF0E6] dark:bg-[#E85D24]/15 text-[#E85D24] dark:text-[#FF9A6C]",
    bar: "bg-[#F97316]",
  },
};

/* ─── Reusable presentational primitives ──────────────────── */

/** Small stat tile — label (uppercase) + big value, icon chip top-right. */
export const StatTile = ({
  label,
  value,
  suffix,
  icon: Icon,
  iconClass = "bg-[#E4F6EF] dark:bg-primary-light text-[#0E9F8E] dark:text-[#2DD4BF]",
}: {
  label: string;
  value: React.ReactNode;
  suffix?: string;
  icon: ElementType;
  iconClass?: string;
}) => (
  <div className="rounded-xl border border-[#E7EEEC] dark:border-border bg-white dark:bg-card p-4 shadow-sm">
    <div className="flex items-start justify-between">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9AAEA9] dark:text-muted-foreground">
        {label}
      </p>
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md",
          iconClass,
        )}
      >
        <Icon className="size-3.5" />
      </span>
    </div>
    <p className="mt-2 text-2xl font-bold text-[#16302b] dark:text-foreground">
      {value}
      {suffix && (
        <span className="ml-1 text-sm font-medium text-[#9AAEA9] dark:text-muted-foreground">
          {suffix}
        </span>
      )}
    </p>
  </div>
);

/** Teal gradient profile banner used by parent & tutor headers. */
export const PortalBanner = ({
  initial,
  title,
  subtitle,
  statLabel,
  statValue,
}: {
  initial: string;
  title: string;
  subtitle: string;
  statLabel: string;
  statValue: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl bg-linear-to-r from-[#0f8f7f] to-[#14b3a1] px-6 py-5 text-white shadow-sm">
    <div className="flex items-center gap-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl font-bold">
        {initial}
      </div>
      <div>
        <h1 className="text-xl font-bold leading-tight">{title}</h1>
        <p className="mt-0.5 text-sm text-white/80">{subtitle}</p>
      </div>
    </div>
    <div className="shrink-0 border-l border-white/25 pl-4 text-right">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
        {statLabel}
      </p>
      <p className="text-3xl font-bold leading-tight">{statValue}</p>
    </div>
  </div>
);

/** Shared page footer note. */
export const PortalFooter = () => (
  <p className="pt-2 text-center text-xs text-[#B7C6C2] dark:text-muted-foreground">
    © 2026 TUTOR VN — Hệ thống quản lý học thuật chuyên nghiệp.
  </p>
);
