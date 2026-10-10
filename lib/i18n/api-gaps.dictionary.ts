import type { Language } from "@/types";

export type ApiGapsDictionary = {
  heading: string;
  description: string;
  all: string;
  statusLabels: Record<"OK" | "MISSING" | "MISMATCH" | "MOCK" | "UNVERIFIED", string>;
  searchPlaceholder: string;
  missingCount: (count: number) => string;
  backendLabel: string;
  noMatch: string;
  unusedHeading: (count: number) => string;
};

export const apiGapsDictionary: Record<Language, ApiGapsDictionary> = {
  vi: {
    heading: "Checklist API còn thiếu",
    description: "Snapshot từ docs/api-review/gap-report.md (2026-10-10). Trang này chỉ hiện ở môi trường dev.",
    all: "Tất cả",
    statusLabels: {
      OK: "Đã có",
      MISSING: "Thiếu",
      MISMATCH: "Lệch",
      MOCK: "Dữ liệu giả",
      UNVERIFIED: "Chưa xác minh",
    },
    searchPlaceholder: "Tìm theo path, file, backend...",
    missingCount: (count) => `${count} thiếu`,
    backendLabel: "Backend",
    noMatch: "Không có request nào khớp bộ lọc.",
    unusedHeading: (count) => `Backend endpoint chưa được UI dùng (${count})`,
  },
  en: {
    heading: "Missing API checklist",
    description: "Snapshot of docs/api-review/gap-report.md (2026-10-10). This page is only shown in development.",
    all: "All",
    statusLabels: {
      OK: "Implemented",
      MISSING: "Missing",
      MISMATCH: "Mismatch",
      MOCK: "Mock data",
      UNVERIFIED: "Unverified",
    },
    searchPlaceholder: "Search by path, file, backend...",
    missingCount: (count) => `${count} missing`,
    backendLabel: "Backend",
    noMatch: "No request matches the filter.",
    unusedHeading: (count) => `Backend endpoints not used by the UI (${count})`,
  },
};
