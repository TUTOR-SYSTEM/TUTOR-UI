"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Eye,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  } from "lucide-react";

import { AddStudentDialog } from "@/components/students/add-student-dialog";
import { RemoveStudentFromClassDialog } from "@/components/students/remove-student-from-class-dialog";
import { SetStudentPasswordDialog } from "@/components/students/set-student-password-dialog";
import { EditStudentDialog } from "@/components/students/edit-student-dialog";
import { DeleteStudentDialog } from "@/components/students/delete-student-dialog";
import {
  useStudentActions,
  STUDENTS_QUERY_KEY,
} from "@/lib/services/student.service";
import { useClassActions } from "@/lib/services/class.service";
import { useParentActions } from "@/lib/services/parent.service";
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
import { useLocale } from "@/hooks/useLocale.hook";
import { formatPersonName } from "@/lib/format/person-name";
import type { Student, ApiStudent, Language } from "@/types";
import UsageGuides, {
  type UsageGuideStep,
} from "@/components/ui/usage-guide.ui";
import { Pagination } from "@/components/ui/pagination.ui";
import { DeleteIcon } from "@/components/ui/delete-icon.ui";

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

function mapApiToStudent(api: ApiStudent, language: Language): Student {
  // Họ Tên order (VI) / First Last (EN) — same rule as the tutors page.
  const fullName = formatPersonName(api.firstName, api.lastName, language) || api.username || "";
  const parentName = api.parent
    ? formatPersonName(api.parent.firstName, api.parent.lastName, language) ||
      api.parent.username ||
      ""
    : "";
  const prefix = "T";
  const classes = api.classes ?? [];
  const tutorName = api.tutor
    ? formatPersonName(api.tutor.firstName, api.tutor.lastName, language) ||
      api.tutor.userCode ||
      ""
    : "";
  return {
    id: api.id,
    tutorId: api.tutorId ?? null,
    parentId: api.parentId ?? null,
    initials: initials(fullName),
    avatarColor: SUBJECT_COLORS[prefix] ?? "#0E9F8E",
    name: fullName,
    firstName: api.firstName?.trim() ?? "",
    lastName: api.lastName?.trim() ?? "",
    subject: "",
    classId: classes[0]?.id ?? null,
    classes: classes.map((c) => ({ id: c.id, name: c.name, code: c.code })),
    classCode: classes.map((c) => c.code).join(", "),
    tutorName,
    studentId: api.userCode ?? "",
    phone: api.phone ?? "",
    gender: api.gender ?? null,
    dateOfBirth: api.dateOfBirth ?? null,
    school: api.school ?? null,
    address: api.address ?? null,
    district: api.district ?? null,
    province: api.province ?? null,
    parentName,
    parentFirstName: api.parent?.firstName?.trim() ?? "",
    parentLastName: api.parent?.lastName?.trim() ?? "",
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
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  // TUTOR manages their own list: it can create students, view their detail, edit a student's
  // details (PUT /students/:id — BE checks ownership; address/parent fields stay locked in the
  // dialog) and remove a student from one of its classes. Delete stays ADMIN-only.
  const role = useCurrentUserRole();
  const isAdmin = role === "ADMIN";
  const canManage = isAdmin || role === "TUTOR";
  const [removingFromClass, setRemovingFromClass] = useState<Student | null>(
    null,
  );
  // Cột "Gia sư" chỉ có ý nghĩa với ADMIN (xem mọi gia sư); TUTOR chỉ thấy học sinh của mình.
  const columnHeaders = [
    copy.list.tableHeaders.stt,
    copy.list.tableHeaders.name,
    // ADMIN sees the class code; TUTOR sees the class name.
    isAdmin ? copy.list.tableHeaders.classCode : copy.list.tableHeaders.className,
    ...(isAdmin ? [copy.list.tableHeaders.tutor] : []),
    copy.list.tableHeaders.studentCode,
    copy.list.tableHeaders.studentPhone,
    copy.list.tableHeaders.parentName,
    copy.list.tableHeaders.parentPhone,
    ...(canManage ? [copy.list.tableHeaders.actions] : []),
  ];
  const columnCount = columnHeaders.length;
  const [passwordStudent, setPasswordStudent] = useState<Student | null>(null);
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

  /* ── fetch students ── */
  const queryParams = {
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
    classId: filterClassId || undefined,
    gender: filterGender || undefined,
    isActive: filterActive === "" ? undefined : filterActive === "true",
  };

  const studentActions = useStudentActions({
    list: queryParams,
    generateCodeOptions: { enabled: false },
  });
  const {
    data: apiPayload,
    isPending,
    isError,
    error,
  } = studentActions.list;

  const { language } = useLocale();
  const students = useMemo(
    () => (apiPayload?.students ?? []).map((s) => mapApiToStudent(s, language)),
    [apiPayload, language],
  );

  const pagination = apiPayload?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  /* ── mutations ── */
  const deleteStudent = studentActions.delete;
  const { deleteParent } = useParentActions();

  const handleAdd = () => {
    invalidate();
    setPage(1);
  };

  const handleDelete = (id: string) => {
    const parentId = deletingStudent?.parentId ?? null;
    const finish = () => {
      invalidate();
      setDeletingStudent(null);
    };
    deleteStudent.mutate(id, {
      onSuccess: () => {
        // Xóa học sinh rồi xóa luôn tài khoản phụ huynh đang liên kết.
        if (!parentId) {
          toast.success(copy.list.deleteSuccess);
          finish();
          return;
        }
        deleteParent.mutate(parentId, {
          onSuccess: () => {
            toast.success(copy.list.deleteSuccess);
            finish();
          },
          onError: (err) => {
            toast.error(getErrorMessage(err, copy.list.deleteParentError));
            finish();
          },
        });
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
          <span className="font-semibold text-[#0E9F8E] dark:text-[#2DD4BF]">
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
      <span className="font-semibold text-[#E85D24] dark:text-[#FF9A6C]">
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
          <div className="flex flex-wrap items-center justify-end gap-2">
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
                className="h-10 w-56 rounded-lg pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleSearchSubmit}
              className="h-10! w-auto! gap-1.5 rounded-lg! border-[#E7EEEC] dark:border-border! bg-white dark:bg-card text-sm text-[#16302b] dark:text-foreground hover:bg-[#F1FBF9] dark:hover:bg-primary-soft"
            >
              <Search className="size-3.5" />
              {common.actions.search}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilterOpen(true)}
              className="h-10! w-auto! gap-1.5 rounded-lg! border-[#E7EEEC] dark:border-border! bg-white dark:bg-card text-sm text-[#16302b] dark:text-foreground hover:bg-[#F1FBF9] dark:hover:bg-primary-soft"
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
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-[#E7EEEC] dark:border-border bg-white dark:bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              {columnHeaders.map((col, i) => (
                  <TableHead
                    key={col}
                    className={`${i === 0 ? "w-14 text-center" : ""} ${col === copy.list.tableHeaders.actions ? "text-center" : ""}`}
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
                  <TableCell className="text-center text-muted-foreground font-medium">
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

                  {/* Class code (ADMIN) / class name(s) (TUTOR) */}
                  <TableCell>
                    {isAdmin ? (
                      s.classCode && (
                        <span className="rounded-md border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {s.classCode}
                        </span>
                      )
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {s.classes.map((c) => (
                          <span
                            key={c.id}
                            className="rounded-md border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
                          >
                            {c.name || c.code}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>

                  {/* Tutor (ADMIN only) */}
                  {isAdmin && (
                    <TableCell className="text-foreground">
                      {s.tutorName || "—"}
                    </TableCell>
                  )}

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

                  {/* Actions: TUTOR xem chi tiết + sửa + gỡ khỏi lớp; ADMIN đặt mật khẩu/sửa/xoá */}
                  {canManage && (
                    <TableCell className="text-center">
                      {isAdmin ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            title={copy.setPasswordDialog.actionTitle}
                            aria-label={copy.setPasswordDialog.actionTitle}
                            onClick={() => setPasswordStudent(s)}
                          >
                            <KeyRound className="size-3.5" />
                          </Button>
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
                            <DeleteIcon />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon-sm"
                            title={copy.rowActions.viewDetail}
                            aria-label={copy.rowActions.viewDetail}
                          >
                            <Link href={`/students/${s.id}`}>
                              <Eye className="size-3.5" />
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            title={common.actions.edit}
                            aria-label={common.actions.edit}
                            onClick={() => setEditingStudent(s)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            disabled={s.classes.length === 0}
                            title={copy.rowActions.removeFromClass}
                            aria-label={copy.rowActions.removeFromClass}
                            onClick={() => setRemovingFromClass(s)}
                          >
                            <DeleteIcon />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}

              {!isPending && students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columnCount} className="py-14 text-center text-muted-foreground">
                    {copy.list.emptyState}
                  </TableCell>
                </TableRow>
              )}
              {isPending && (
                <TableRow>
                  <TableCell colSpan={columnCount} className="py-14 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={columnCount} className="py-14 text-center text-destructive">
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
          className="border-t border-[#EEF3F1] dark:border-border-light px-4 py-3"
        />
      </div>

      {/* ── Add student dialog ── */}
      <AddStudentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAdd}
      />

      {/* ── Set password dialog (ADMIN + TUTOR owner) ── */}
      <SetStudentPasswordDialog
        open={passwordStudent !== null}
        student={passwordStudent}
        onClose={() => setPasswordStudent(null)}
      />

      {/* ── Remove student from class dialog (TUTOR) ── */}
      <RemoveStudentFromClassDialog
        student={removingFromClass}
        onClose={() => setRemovingFromClass(null)}
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
        hasParent={!!deletingStudent?.parentId}
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

      </Dialog>

      <UsageGuides
        title={copy.list.guide.title}
        steps={usageGuideSteps}
        warning={usageGuideWarning}
      />
    </div>
  );
}
