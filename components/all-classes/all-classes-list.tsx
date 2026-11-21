"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, RefreshCw, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/axios";
import { useAdminTutors } from "@/hooks/useAdminUsers.hook";
import { useAllClassesCopy } from "@/hooks/useAllClassesCopy.hook";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import { useClassActions, invalidateClassRelatedQueries } from "@/lib/services/class.service";
import { currentPersonName } from "@/lib/format/person-name";
import { cn } from "@/lib/utils";
import { AddClassDialog } from "@/components/all-classes/add-class-dialog";
import { ClassStatusMenu } from "@/components/classes/components/class-status-menu";
import { DeleteClassDialog } from "@/components/classes/dialog/delete-class-dialog";
import { EditClassDialog } from "@/components/classes/dialog/edit-class-dialog";
import { Button } from "@/components/ui/button.ui";
import { Dialog } from "@/components/ui/dialog-form.ui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import { Pagination } from "@/components/ui/pagination.ui";
import { Select } from "@/components/ui/select.ui";
import UsageGuides from "@/components/ui/usage-guide.ui";
import type { ApiClassRow, ClassesProps, ClassStatus } from "@/types";

const PAGE_SIZE = 10;
const HEAD = "px-4";
const CELL = "px-4 py-3.5";

/** Pill colors per class status (same palette as the class list legend). */
const STATUS_BADGE: Record<ClassStatus, string> = {
  OPEN: "bg-[#E4F6EF] text-[#0B7A6D]",
  UPCOMING: "bg-[#F3F4F6] text-[#4B5563]",
  CLOSED: "bg-[#FEE2E2] text-[#DC2626]",
};

export function AllClassesList() {
  const copy = useAllClassesCopy();
  const common = useCommonCopy();
  // `searchInput` = what is typed; `search` = what is applied (on Enter or the Search button).
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [status, setStatus] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingClass, setEditingClass] =
    useState<ClassesProps["classItem"]>(null);
  const [deletingClass, setDeletingClass] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const queryClient = useQueryClient();
  const handleSearchSubmit = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const { data: tutorsRaw } = useAdminTutors({ page: 1, limit: 100 });
  const tutorName = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tutorsRaw?.tutors ?? []) {
      map.set(
        t.id,
        currentPersonName(t.firstName, t.lastName) || t.email || "",
      );
    }
    return map;
  }, [tutorsRaw]);
  const tutorOptions = useMemo(
    () => [
      { label: copy.tutorFilterAll, value: "" },
      ...(tutorsRaw?.tutors ?? []).map((t) => ({
        label: tutorName.get(t.id) ?? "",
        value: t.id,
      })),
    ],
    [tutorsRaw, tutorName, copy.tutorFilterAll],
  );
  const assignableTutorOptions = useMemo(
    () => tutorOptions.filter((o) => o.value !== ""),
    [tutorOptions],
  );
  const statusOptions = useMemo(
    () => [
      { label: copy.statusFilterAll, value: "" },
      { label: copy.status.OPEN, value: "OPEN" },
      { label: copy.status.UPCOMING, value: "UPCOMING" },
      { label: copy.status.CLOSED, value: "CLOSED" },
    ],
    [copy],
  );

  const activeFilterCount = [tutorId, status].filter(Boolean).length;

  const handleResetFilters = () => {
    setTutorId("");
    setStatus("");
    setPage(1);
  };

  const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
  if (search) params.search = search;
  if (tutorId) params.tutorId = tutorId;
  if (status) params.status = status;

  const classActions = useClassActions({ list: params });
  const { data, isPending, isError, error, refetch } = classActions.list;
  const { mutate: updateClass, isPending: statusUpdating } =
    classActions.update;
  const invalidateClasses = () => invalidateClassRelatedQueries(queryClient);

  const handleChangeStatus = (id: string, next: ClassStatus) =>
    updateClass(
      { id, status: next },
      {
        onSuccess: () => {
          toast.success(copy.rowActions.statusSuccess);
          invalidateClasses();
        },
        onError: (err) =>
          toast.error(getErrorMessage(err, copy.rowActions.statusError)),
      },
    );
  const classes = data?.classes ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;

  const columns: DataTableColumn<ApiClassRow>[] = [
    {
      key: "index",
      header: copy.columns.index,
      width: "56px",
      headerClassName: HEAD,
      cellClassName: CELL,
      render: (_row, i) => (page - 1) * PAGE_SIZE + i + 1,
    },
    {
      key: "name",
      header: copy.columns.name,
      headerClassName: HEAD,
      cellClassName: `${CELL} font-medium text-foreground`,
      render: (row) => row.name,
    },
    {
      key: "code",
      header: copy.columns.code,
      headerClassName: HEAD,
      cellClassName: CELL,
      render: (row) => row.code,
    },
    {
      key: "subject",
      header: copy.columns.subject,
      headerClassName: HEAD,
      cellClassName: CELL,
      render: (row) => row.subject || "—",
    },
    {
      key: "tutor",
      header: copy.columns.tutor,
      headerClassName: HEAD,
      cellClassName: CELL,
      render: (row) =>
        (row.tutorId && tutorName.get(row.tutorId)) || copy.unknownTutor,
    },
    {
      key: "students",
      header: copy.columns.students,
      headerClassName: `${HEAD}`,
      cellClassName: `${CELL}`,
      render: (row) => row.students?.length ?? 0,
    },
    {
      key: "status",
      align: "center" as const,
      header: copy.columns.status,
      headerClassName: HEAD,
      cellClassName: CELL,
      render: (row) => {
        if (!row.status) return "—";
        const status = row.status as ClassStatus;
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
              STATUS_BADGE[status],
            )}
          >
            {copy.status[status]}
          </span>
        );
      },
    },
    {
      key: "actions",
      align: "center" as const,
      header: copy.columns.actions,
      width: "140px",
      headerClassName: `${HEAD}`,
      cellClassName: CELL,
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <ClassStatusMenu
            status={(row.status ?? "OPEN") as ClassStatus}
            statusLabel={copy.status}
            onChangeStatus={(next) => handleChangeStatus(row.id, next)}
            disabled={statusUpdating}
            ariaLabel={copy.rowActions.changeStatus}
            triggerIcon={RefreshCw}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={copy.rowActions.edit}
            aria-label={copy.rowActions.edit}
            onClick={() =>
              setEditingClass({
                id: row.id,
                tutorId: row.tutorId ?? null,
                maxStudents: row.maxStudents ?? 10,
                name: row.name,
                subject: row.subject,
                feePerSession: Number(row.tuition ?? 0),
                description: row.description ?? "",
                status: row.status ?? "OPEN",
                curriculumId: row.curriculumId ?? "",
                format: row.format ?? "",
                location: row.location ?? "",
                startTime: row.startTime ?? "",
                endTime: row.endTime ?? "",
              })
            }
            className="text-muted-foreground hover:text-primary"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={copy.rowActions.delete}
            aria-label={copy.rowActions.delete}
            onClick={() => setDeletingClass({ id: row.id, name: row.name })}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="gap-1.5"
        >
          <Plus className="size-4" />
          {copy.addButton}
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                placeholder={copy.searchPlaceholder}
                className="w-64 pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleSearchSubmit}
            >
              <Search className="size-3.5" />
              {common.actions.search}
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFilterOpen(true)}
            className="gap-1.5"
          >
            <SlidersHorizontal className="size-3.5" />
            {common.actions.filter}
            {activeFilterCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <DataTable
          data={classes}
          columns={columns}
          rowKey={(row) => row.id}
          isLoading={isPending}
          isError={isError}
          errorMessage={getErrorMessage(error, copy.loadError)}
          emptyMessage={copy.empty}
        />
        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-3">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <AddClassDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={() => refetch()}
        tutorOptions={assignableTutorOptions}
      />

      <EditClassDialog
        classItem={editingClass}
        onClose={() => {
          setEditingClass(null);
          invalidateClasses();
        }}
      />

      <DeleteClassDialog
        classItem={deletingClass}
        onClose={() => {
          setDeletingClass(null);
          invalidateClasses();
        }}
      />

      {/* ── Filter dialog: lọc áp dụng ngay khi chọn, nút đóng chỉ đóng popup ── */}
      <Dialog
        isOpen={filterOpen}
        icon={SlidersHorizontal}
        title={copy.filterPopup.title}
        cancelText={common.actions.close}
        onCancel={() => setFilterOpen(false)}
        submitText={copy.filterPopup.applyButton}
        onSubmit={() => setFilterOpen(false)}
        className="w-105!"
      >
        <div className="flex flex-col gap-1.5">
          <Label>{copy.filterPopup.tutorLabel}</Label>
          <Select
            options={tutorOptions}
            value={tutorId}
            onValueChange={(v) => {
              setTutorId(v);
              setPage(1);
            }}
            placeholder={copy.tutorFilterPlaceholder}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{copy.filterPopup.statusLabel}</Label>
          <Select
            options={statusOptions}
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            placeholder={copy.statusFilterAll}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleResetFilters}
          disabled={activeFilterCount === 0}
          className="w-full"
        >
          {copy.filterPopup.resetButton}
        </Button>
      </Dialog>

      <UsageGuides title={copy.guide.title} steps={copy.guide.steps} />
    </div>
  );
}
