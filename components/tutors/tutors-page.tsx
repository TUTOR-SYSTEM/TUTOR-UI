"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Search, ShieldOff, Trash2 } from "lucide-react";

import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useAdminTutors, useDeleteTutor } from "@/hooks/useAdminUsers.hook";
import { useLocale } from "@/hooks/useLocale.hook";
import { useTutorsCopy } from "@/hooks/useTutorsCopy.hook";
import { useUserActions } from "@/lib/services/user.service";
import { formatPersonName } from "@/lib/format/person-name";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Pagination } from "@/components/ui/pagination.ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.ui";
import { AddTutorDialog } from "@/components/tutors/add-tutor-dialog";
import { EditTutorDialog } from "@/components/tutors/edit-tutor-dialog";
import { DeleteTutorDialog } from "@/components/tutors/delete-tutor-dialog";
import UsageGuides from "@/components/ui/usage-guide.ui";
import type { ApiManagedUser } from "@/types";

const PAGE_SIZE = 10;
const TUTORS_QUERY_KEY = ["admin", "tutors"] as const;

function initials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.trim().charAt(0) ?? "";
  const l = lastName?.trim().charAt(0) ?? "";
  return (f + l).toUpperCase() || "G";
}

export function TutorsPage() {
  const role = useCurrentUserRole();
  const queryClient = useQueryClient();
  const copy = useTutorsCopy();
  const { language } = useLocale();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState<ApiManagedUser | null>(null);
  const [deletingTutor, setDeletingTutor] = useState<ApiManagedUser | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fullName = (t: ApiManagedUser) =>
    formatPersonName(t.firstName, t.lastName, language) || copy.unnamed;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: TUTORS_QUERY_KEY });

  const params: { page: number; limit: number; search?: string } = {
    page,
    limit: PAGE_SIZE,
  };
  if (search.trim()) params.search = search.trim();

  const { data, isPending, isError, error, refetch } = useAdminTutors(
    params,
    role === "ADMIN",
  );

  const { toggleStatus } = useUserActions();
  const deleteTutor = useDeleteTutor();

  const handleToggleStatus = (tutor: ApiManagedUser) => {
    if (tutor.isActive && !window.confirm(copy.status.lockConfirm(fullName(tutor)))) {
      return;
    }
    toggleStatus.mutate(
      { id: tutor.id, isActive: !tutor.isActive },
      {
        onSuccess: () => {
          invalidate();
          toast.success(copy.toast.statusUpdated);
        },
        onError: (err) =>
          toast.error(getErrorMessage(err, copy.toast.statusFailed)),
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteTutor.mutate(id, {
      onSuccess: () => {
        invalidate();
        setDeletingTutor(null);
        toast.success(copy.toast.deleted);
      },
      onError: (err) => toast.error(getErrorMessage(err, copy.toast.deleteFailed)),
    });
  };

  const columns = [
    copy.columns.index,
    copy.columns.tutor,
    copy.columns.subjects,
    copy.columns.phone,
    copy.columns.classCount,
    copy.columns.studentCount,
    copy.columns.status,
    copy.columns.actions,
  ];

  if (role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[#E7EEEC] bg-white py-24 text-center shadow-sm">
        <span className="flex size-12 items-center justify-center rounded-full bg-[#FFF0E6]">
          <ShieldOff className="size-6 text-[#E85D24]" />
        </span>
        <h2 className="text-lg font-bold text-[#16302b]">
          {copy.page.noAccessTitle}
        </h2>
        <p className="max-w-sm text-sm text-[#8AA09B]">
          {copy.page.noAccessDescription}
        </p>
      </div>
    );
  }

  const tutors = data?.tutors ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#16302b]">{copy.page.title}</h1>
          {!isPending && !isError ? (
            <span className="rounded-full bg-[#E4F6EF] px-3 py-0.5 text-sm font-semibold text-[#0E9F8E]">
              {copy.page.countSuffix(total)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 size-3.5 text-[#9AAEA9]" />
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={copy.page.searchPlaceholder}
              aria-label={copy.page.searchPlaceholder}
              className="h-9! w-56 pl-9"
            />
          </div>
          <Button
            type="button"
            size="lg"
            onClick={() => setIsAddOpen(true)}
            className="w-auto! gap-1.5 px-4"
          >
            <Plus className="size-4" />
            {copy.page.add}
          </Button>
        </div>
      </div>

      <AddTutorDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={() => {
          setPage(1);
          void refetch();
        }}
      />

      <EditTutorDialog
        tutor={editingTutor}
        onClose={() => setEditingTutor(null)}
        onSaved={invalidate}
      />

      <DeleteTutorDialog
        tutor={deletingTutor}
        loading={deleteTutor.isPending}
        onClose={() => setDeletingTutor(null)}
        onConfirm={handleDelete}
      />

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#E7EEEC] bg-[#F3F7F5]">
              {columns.map((col, i) => (
                <TableHead
                  key={col}
                  className={cn(
                    "h-auto px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]",
                    i === 0 ? "w-14" : "",
                    i === columns.length - 1 ? "text-right" : "text-left",
                  )}
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tutors.map((t, i) => (
              <TableRow
                key={t.id}
                className="border-b border-[#EEF3F1] last:border-0 hover:bg-[#F1FBF9]"
              >
                <TableCell className="px-4 py-3.5 font-medium text-[#9AAEA9]">
                  {String((page - 1) * PAGE_SIZE + i + 1).padStart(2, "0")}
                </TableCell>

                <TableCell className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    {t.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.avatar}
                        alt={fullName(t)}
                        className="size-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: "#0E9F8E" }}
                      >
                        {initials(t.firstName, t.lastName)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold leading-tight text-[#16302b]">
                        {fullName(t)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#8AA09B]">
                        {t.email || "—"}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-4 py-3.5">
                  {t.subjects && t.subjects.length ? (
                    <div className="flex flex-wrap gap-1">
                      {t.subjects.map((s) => (
                        <span
                          key={s}
                          className="rounded-md bg-[#E4F6EF] px-2 py-0.5 text-xs font-medium text-[#0B7A6D]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#9AAEA9]">—</span>
                  )}
                </TableCell>

                <TableCell className="px-4 py-3.5 text-[#16302b]">
                  {t.phone || "—"}
                </TableCell>

                <TableCell className="px-4 py-3.5 text-center text-[#16302b]">
                  {t.classCount ?? "—"}
                </TableCell>

                <TableCell className="px-4 py-3.5 text-center text-[#16302b]">
                  {t.studentCount ?? "—"}
                </TableCell>

                <TableCell className="px-4 py-3.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(t)}
                    disabled={toggleStatus.isPending}
                    title={copy.status.toggleTitle}
                    className={cn(
                      "h-auto! w-auto! rounded-md px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60",
                      t.isActive
                        ? "bg-[#E4F6EF]! text-[#0B7A6D] hover:bg-[#E4F6EF]!"
                        : "bg-[#FEE2E2]! text-[#DC2626] hover:bg-[#FEE2E2]!",
                    )}
                  >
                    {t.isActive ? copy.status.active : copy.status.locked}
                  </Button>
                </TableCell>

                <TableCell className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title={copy.rowActions.edit}
                      aria-label={copy.rowActions.edit}
                      onClick={() => setEditingTutor(t)}
                      className="rounded-md text-[#8AA09B] hover:bg-[#E4F6EF] hover:text-[#0E9F8E]"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title={copy.rowActions.delete}
                      aria-label={copy.rowActions.delete}
                      onClick={() => setDeletingTutor(t)}
                      className="rounded-md text-[#8AA09B] hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {!isPending && !isError && tutors.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-14 text-center text-[#9AAEA9]"
                >
                  {copy.page.empty}
                </TableCell>
              </TableRow>
            )}
            {isPending && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-14 text-center text-[#9AAEA9]"
                >
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-14 text-center text-red-500"
                >
                  {getErrorMessage(error, copy.page.loadError)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="border-t border-[#EEF3F1] px-4 py-3">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <UsageGuides
        title={copy.guide.title}
        steps={copy.guide.steps}
      />
    </div>
  );
}
