"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Calendar, Layers, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { useGet } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import type {
  CurriculumFramework,
  CurriculumFrameworksApiPayload,
} from "@/types";

import { CurriculumFormDialog } from "../dialog/curriculum-form-dialog";
import { DeleteCurriculumDialog } from "../dialog/delete-curriculum-dialog";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Pagination } from "@/components/ui/pagination.ui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table.ui";
import UsageGuides, {
  type UsageGuideStep,
} from "@/components/ui/usage-guide.ui";
import { useCurriculumCopy } from "@/hooks/useCurriculumCopy.hook";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/axios";
import { CURRICULUM_QUERY_KEY } from "@/lib/services/curriculum.service";

/* ─── Icon color presets ─────────────────────────────────── */

const ICON_COLORS = [
  "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
];

const DEFAULT_PAGE_SIZE = 10;

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

const USAGE_GUIDE_STEPS: UsageGuideStep[] = [
  {
    n: 1,
    title: "Tìm kiếm",
    body: (
      <>
        Nhập tên môn học hoặc mã chương trình vào ô tìm kiếm, sau đó nhấn{" "}
        <span className="font-semibold text-emerald-600">Enter</span> hoặc nút{" "}
        <span className="font-semibold text-emerald-600">Tìm kiếm</span> để lọc.
      </>
    ),
  },
  {
    n: 2,
    title: "Tạo chương trình",
    body: (
      <>
        Nhấn{" "}
        <span className="font-semibold text-emerald-600">Tạo chương trình</span>{" "}
        để thêm khung chương trình mới.
      </>
    ),
  },
  {
    n: 3,
    title: "Mở chi tiết",
    body: (
      <>
        Nhấn vào một thẻ để xem lộ trình bài giảng, tài liệu và tiến độ giảng
        dạy.
      </>
    ),
  },
  {
    n: 4,
    title: "Sửa / Xoá",
    body: (
      <>
        Dùng icon <span className="font-semibold text-[#16302b]">✏️ / 🗑️</span>{" "}
        ở góc dưới thẻ để chỉnh sửa hoặc xoá khung chương trình.
      </>
    ),
  },
];

const USAGE_GUIDE_WARNING = (
  <>
    <span className="font-semibold text-[#E85D24]">Lưu ý:</span> Xoá khung
    chương trình sẽ xoá luôn tất cả chương và bài học liên quan, không thể hoàn
    tác.
  </>
);

/* ─── Main page ──────────────────────────────────────────── */

export const CurriculumListPage = () => {
  const router = useRouter();
  const copy = useCurriculumCopy();

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CurriculumFramework | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<CurriculumFramework | null>(
    null,
  );

  const params: Record<string, unknown> = { page, limit: pageSize };
  if (search.trim()) params.search = search.trim();

  const {
    data: apiPayload,
    isPending,
    isError,
    error,
  } = useGet<unknown, CurriculumFrameworksApiPayload>(
    [...CURRICULUM_QUERY_KEY, page, pageSize, search],
    "/curriculum",
    {
      params,
      select: (raw) => unwrapApiData<CurriculumFrameworksApiPayload>(raw),
    },
  );

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const frameworks = apiPayload?.curriculums ?? [];
  const pagination = apiPayload?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalFrameworks = pagination?.total ?? 0;

  const columns: DataTableColumn<CurriculumFramework>[] = [
    {
      key: "stt",
      header: copy.table.stt,
      headerClassName:
        "w-14 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
      cellClassName: "px-4 py-3.5 font-medium text-muted-foreground",
      render: (_fw, i) =>
        String((page - 1) * pageSize + i + 1).padStart(2, "0"),
    },
    {
      key: "subject",
      header: copy.table.program,
      headerClassName:
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
      cellClassName: "px-4 py-3.5",
      render: (fw, i) => (
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              ICON_COLORS[i % ICON_COLORS.length],
            )}
          >
            <BookOpen className="size-4" />
          </span>
          <div className="min-w-0">
            <p
              className="truncate font-semibold leading-tight cursor-pointer"
              onClick={() => router.push(`/curriculum/${fw.id}`)}
            >
              {fw.subject}
              {fw.grade ? copy.table.gradePrefix(fw.grade) : ""}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {copy.table.codePrefix} {fw.code}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "courseTime",
      header: copy.table.courseTime,
      headerClassName:
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
      cellClassName: "px-4 py-3.5",
      render: (fw) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          <Calendar className="size-3" />
          {fw.courseTime}
        </span>
      ),
    },
    {
      key: "summary",
      header: copy.table.summaryHeader,
      headerClassName:
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
      cellClassName: "px-4 py-3.5",
      render: (fw) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          <Layers className="size-3" />
          {copy.table.summary(fw.chapterCount, fw.lessonCount)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: copy.table.createdAt,
      headerClassName:
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
      cellClassName: "px-4 py-3.5 text-foreground",
      render: (fw) => formatDate(fw.createdAt),
    },
    {
      key: "actions",
      header: copy.table.actions,
      headerClassName:
        "px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground",
      cellClassName: "px-4 py-3.5",
      render: (fw) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={copy.table.edit}
            onClick={() => setEditTarget(fw)}
            className="rounded-md text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={copy.table.delete}
            onClick={() => setDeleteTarget(fw)}
            className="rounded-md text-muted-foreground hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {copy.header.title}
          </h1>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
            {copy.header.countSuffix(totalFrameworks)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={copy.header.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-9! w-56 pl-9 pr-3 text-sm"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleSearch}
            className="h-9! w-auto! gap-1.5 px-3 text-sm font-medium"
          >
            <Search className="size-3.5" />
            {copy.header.searchButton}
          </Button>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="size-4" />
            {copy.header.create}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="overflow-hidden rounded-t-2xl">
          <DataTable
            data={frameworks}
            columns={columns}
            rowKey={(fw) => fw.id}
            isLoading={isPending}
            isError={isError}
            errorMessage={getErrorMessage(error, copy.list.loadErrorFallback)}
            emptyMessage={
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                <BookOpen className="size-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  {search ? copy.list.emptySearch : copy.list.emptyDefault}
                </p>
                {!search && (
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setCreateOpen(true)}
                    className="h-auto! w-auto! p-0! text-sm font-medium text-emerald-600"
                  >
                    {copy.list.createFirst}
                  </Button>
                )}
              </div>
            }
            headerRowClassName="border-b border-border/60 bg-muted/40"
            rowClassName="border-b border-border/60 last:border-0 hover:bg-muted/30"
            pageSize={pageSize}
          />
        </div>

        <div className="border-t border-border/60 px-4 py-3">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <CurriculumFormDialog
        open={createOpen || !!editTarget}
        initial={editTarget}
        onClose={() => {
          setCreateOpen(false);
          setEditTarget(null);
        }}
      />
      <DeleteCurriculumDialog
        framework={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />

      <UsageGuides steps={USAGE_GUIDE_STEPS} warning={USAGE_GUIDE_WARNING} />
    </div>
  );
};
