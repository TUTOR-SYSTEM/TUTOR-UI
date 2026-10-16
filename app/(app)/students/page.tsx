"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import { AddStudentDialog } from "@/components/students/add-student-dialog";
import { EditStudentDialog } from "@/components/students/edit-student-dialog";
import { DeleteStudentDialog } from "@/components/students/delete-student-dialog";
import {
  useStudentActions,
  STUDENTS_QUERY_KEY,
} from "@/lib/services/student.service";
import { useClassActions } from "@/lib/services/class.service";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { getErrorMessage } from "@/lib/axios";
import { Button } from "@/components/ui/button.ui";
import { Dialog } from "@/components/ui/dialog-form.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import { Select } from "@/components/ui/select.ui";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table.ui";
import { useStudentsCopy } from "@/hooks/useStudentsCopy.hook";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import type { Student, ApiStudent } from "@/types";
import UsageGuides, {
  type UsageGuideStep,
} from "@/components/ui/usage-guide.ui";
import { Pagination } from "@/components/ui/pagination.ui";

/* ─── avatar colour by subject prefix ─── */
const SUBJECT_COLORS: Record<string, string> = {
  T: "#0E9F8E", // Toán
  L: "#2563EB", // Lý
  H: "#7C3AED", // Hóa
  V: "#DB2777", // Văn
  A: "#F59E0B", // Tiếng Anh
};

function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return (parts[0][0] ?? "?").toUpperCase();
  return (
    (parts[parts.length - 2]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
}

function mapApiToStudent(api: ApiStudent): Student {
  const fullName =
    [api.firstName, api.lastName].filter(Boolean).join(" ") ||
    api.username ||
    "";
  const parentName = api.parent
    ? [api.parent.firstName, api.parent.lastName].filter(Boolean).join(" ") ||
      api.parent.username ||
      ""
    : "";
  const prefix = "T";
  const classes = api.classes ?? [];
  return {
    id: api.id,
    initials: initials(fullName),
    avatarColor: SUBJECT_COLORS[prefix] ?? "#0E9F8E",
    name: fullName,
    subject: "",
    classId: classes[0]?.id ?? null,
    classCode: classes.map((c) => c.code).join(", "),
    studentId: api.userCode ?? "",
    phone: api.phone ?? "",
    gender: api.gender ?? null,
    dateOfBirth: api.dateOfBirth ?? null,
    school: api.school ?? null,
    address: api.address ?? null,
    district: api.district ?? null,
    province: api.province ?? null,
    parentName,
    parentPhone: api.parent?.phone ?? "",
    parentEmail: api.parent?.email ?? null,
    parentRelationship: api.parent?.relationship ?? null,
    parentAddress: api.parent?.address ?? null,
    parentDistrict: api.parent?.district ?? null,
    parentProvince: api.parent?.province ?? null,
  };
}

const PAGE_SIZE = 8;

/* ─── component ─── */
export default function StudentsPage() {
  const copy = useStudentsCopy();
  const common = useCommonCopy();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  // PUT/DELETE /students/:id are ADMIN-only on the gateway; TUTOR gets a read-only list.
  const isAdmin = useCurrentUserRole() === "ADMIN";
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterClassId, setFilterClassId] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterActive, setFilterActive] = useState("");

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });

  const handleSearchSubmit = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  /* ── class list (tabs + filter popup options) ── */
  const { data: filterClassesRaw } = useClassActions({
    list: { limit: 100 },
  }).list;
  const classes = useMemo(
    () =>
      (filterClassesRaw?.classes ?? []) as {
        id: string;
        name: string;
        code: string;
      }[],
    [filterClassesRaw],
  );

  const classTabs = useMemo(
    () => [
      { label: copy.list.tabs.all, value: "" },
      ...classes.map((c) => ({ label: c.name, value: c.code })),
    ],
    [copy, classes],
  );

  const filterClassOptions = useMemo(
    () =>
      classes.map((c) => ({
        label: `${c.name} (${c.code})`,
        value: c.id,
      })),
    [classes],
  );

  const genderOptions = useMemo(
    () => [
      { label: copy.list.filterPopup.genderMale, value: "MALE" },
      { label: copy.list.filterPopup.genderFemale, value: "FEMALE" },
      { label: copy.list.filterPopup.genderOther, value: "OTHER" },
    ],
    [copy],
  );

  const statusOptions = useMemo(
    () => [
      { label: copy.list.filterPopup.statusActive, value: "true" },
      { label: copy.list.filterPopup.statusInactive, value: "false" },
    ],
    [copy],
  );

  const activeFilterCount = [filterClassId, filterGender, filterActive].filter(
    Boolean,
  ).length;

  const handleResetFilters = () => {
    setFilterClassId("");
    setFilterGender("");
    setFilterActive("");
    setPage(1);
  };

  /* ── fetch students ── */
  const queryParams = {
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
    classCode: activeTab || undefined,
    classId: filterClassId || undefined,
    gender: filterGender || undefined,
    isActive: filterActive === "" ? undefined : filterActive === "true",
  };

  const studentActions = useStudentActions({ list: queryParams });
  const {
    data: apiPayload,
    isPending,
    isError,
    error,
  } = studentActions.list;

  const students = useMemo(
    () => (apiPayload?.students ?? []).map(mapApiToStudent),
    [apiPayload],
  );

  const pagination = apiPayload?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  /* ── mutations ── */
  const deleteStudent = studentActions.delete;

  const handleAdd = () => {
    invalidate();
    setPage(1);
  };

  const handleDelete = (id: string) => {
    deleteStudent.mutate(id, {
      onSuccess: () => {
        invalidate();
        toast.success(copy.list.deleteSuccess);
        setDeletingStudent(null);
      },
      onError: (err) =>
        toast.error(getErrorMessage(err, copy.list.deleteError)),
    });
  };

  const usageGuideSteps: UsageGuideStep[] = [
    {
      n: 1,
      title: copy.list.guide.step1Title,
      body: (
        <>
          {copy.list.guide.step1Prefix}{" "}
          <span className="font-semibold text-[#0E9F8E]">
            {copy.list.guide.step1Highlight}
          </span>{" "}
          {copy.list.guide.step1Suffix}
        </>
      ),
    },
    {
      n: 2,
      title: copy.list.guide.step2Title,
      body: copy.list.guide.step2Body,
    },
    {
      n: 3,
      title: copy.list.guide.step3Title,
      body: copy.list.guide.step3Body,
    },
    {
      n: 4,
      title: copy.list.guide.step4Title,
      body: copy.list.guide.step4Body,
    },
  ];

  const usageGuideWarning = (
    <>
      <span className="font-semibold text-[#E85D24]">
        {copy.list.guide.noteLabel}
      </span>{" "}
      {copy.list.guide.noteBody}
    </>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            type="button"
            size={"lg"}
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: "#0E9F8E" }}
          >
            <Plus className="size-4" />
            {copy.list.addButton}
          </Button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                placeholder={copy.list.searchPlaceholder}
                className="h-9 w-56 rounded-lg pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleSearchSubmit}
              className="h-9! w-auto! gap-1.5 rounded-lg! border-[#E7EEEC]! bg-white text-sm text-[#16302b] hover:bg-[#F1FBF9]"
            >
              <Search className="size-3.5" />
              {common.actions.search}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {classTabs.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              variant={activeTab === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveTab(tab.value);
                setPage(1);
              }}
              className="rounded-full"
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setFilterOpen(true)}
          className="h-9! w-auto! gap-1.5 rounded-lg! border-[#E7EEEC]! bg-white text-sm text-[#16302b] hover:bg-[#F1FBF9]"
        >
          <SlidersHorizontal className="size-3.5" />
          {common.actions.filter}
          {activeFilterCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-[#0E9F8E] text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              {[
                  copy.list.tableHeaders.stt,
                  copy.list.tableHeaders.name,
                  copy.list.tableHeaders.classCode,
                  copy.list.tableHeaders.studentCode,
                  copy.list.tableHeaders.studentPhone,
                  copy.list.tableHeaders.parentName,
                  copy.list.tableHeaders.parentPhone,
                  ...(isAdmin ? [copy.list.tableHeaders.actions] : []),
                ].map((col, i) => (
                  <TableHead
                    key={col}
                    className={`${i === 7 ? "text-right" : ""} ${i === 0 ? "w-14" : ""}`}
                  >
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s, i) => (
                <TableRow
                  key={s.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {/* STT */}
                  <TableCell className="text-muted-foreground font-medium">
                    {String((page - 1) * PAGE_SIZE + i + 1).padStart(2, "0")}
                  </TableCell>

                  {/* Name + subject */}
                  <TableCell>
                    <Link
                      href={`/students/${s.id}`}
                      className="group flex items-center gap-3"
                    >
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: s.avatarColor }}
                      >
                        {s.initials}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground leading-tight group-hover:text-primary group-hover:underline">
                          {s.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.subject}
                        </p>
                      </div>
                    </Link>
                  </TableCell>

                  {/* Class code */}
                  <TableCell>
                    {s.classCode && (
                      <span className="rounded-md border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {s.classCode}
                      </span>
                    )}
                  </TableCell>

                  {/* Student ID */}
                  <TableCell>
                    <span className="rounded-md bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                      {s.studentId}
                    </span>
                  </TableCell>

                  {/* Phone */}
                  <TableCell className="text-foreground">{s.phone}</TableCell>

                  {/* Parent name */}
                  <TableCell className="text-foreground">{s.parentName}</TableCell>

                  {/* Parent phone */}
                  <TableCell className="text-foreground">
                    {s.parentPhone}
                  </TableCell>

                  {/* Actions (ADMIN only) */}
                  {isAdmin && (
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          title={common.actions.edit}
                          onClick={() => setEditingStudent(s)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          title={common.actions.delete}
                          onClick={() => setDeletingStudent(s)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}

              {!isPending && students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-14 text-center text-muted-foreground">
                    {copy.list.emptyState}
                  </TableCell>
                </TableRow>
              )}
              {isPending && (
                <TableRow>
                  <TableCell colSpan={8} className="py-14 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={8} className="py-14 text-center text-destructive">
                    {getErrorMessage(error, copy.list.loadError)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="border-t border-[#EEF3F1] px-4 py-3"
        />
      </div>

      {/* ── Add student dialog ── */}
      <AddStudentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAdd}
      />

      {/* ── Edit student dialog ── */}
      <EditStudentDialog
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onSaved={invalidate}
      />

      {/* ── Delete student dialog ── */}
      <DeleteStudentDialog
        student={deletingStudent}
        onClose={() => setDeletingStudent(null)}
        onConfirm={handleDelete}
      />

      {/* ── Filter dialog ── */}
      <Dialog
        isOpen={filterOpen}
        icon={SlidersHorizontal}
        title={copy.list.filterPopup.title}
        cancelText={common.actions.close}
        onCancel={() => setFilterOpen(false)}
        submitText={copy.list.filterPopup.applyButton}
        onSubmit={() => setFilterOpen(false)}
        className="w-105!"
      >
        <div className="flex flex-col gap-1.5">
          <Label>
            {copy.list.filterPopup.classLabel}
          </Label>
          <Select
            options={filterClassOptions}
            value={filterClassId}
            onValueChange={(v) => {
              setFilterClassId(v);
              setPage(1);
            }}
            placeholder={copy.list.filterPopup.classPlaceholder}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>
            {copy.list.filterPopup.genderLabel}
          </Label>
          <Select
            options={genderOptions}
            value={filterGender}
            onValueChange={(v) => {
              setFilterGender(v);
              setPage(1);
            }}
            placeholder={copy.list.filterPopup.genderPlaceholder}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>
            {copy.list.filterPopup.statusLabel}
          </Label>
          <Select
            options={statusOptions}
            value={filterActive}
            onValueChange={(v) => {
              setFilterActive(v);
              setPage(1);
            }}
            placeholder={copy.list.filterPopup.statusPlaceholder}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleResetFilters}
          disabled={activeFilterCount === 0}
          className="w-full! rounded-lg! border-[#E7EEEC]! bg-white text-xs! font-medium text-[#16302b] hover:bg-[#F3F7F5]"
        >
          {copy.list.filterPopup.resetButton}
        </Button>
      </Dialog>

      <UsageGuides
        title={copy.list.guide.title}
        steps={usageGuideSteps}
        warning={usageGuideWarning}
      />
    </div>
  );
}
