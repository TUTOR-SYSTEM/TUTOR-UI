"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  XCircle,
} from "lucide-react";

import { EditStudentDialog } from "@/components/students/edit-student-dialog";
import { useStudentActions } from "@/lib/services/student.service";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useExerciseActions } from "@/lib/services/exercise.service";
import { getErrorMessage } from "@/lib/axios";
import { useStudentsCopy } from "@/hooks/useStudentsCopy.hook";
import type { ApiStudent, Student } from "@/types";
import type { ExerciseDetail } from "@/types/session.types";
import {
  DownloadFileRow,
  EXERCISE_STATUS_META,
  StatusBadge,
  fmtDate,
  fmtDateTime,
} from "@/components/sessions/session-shared";

type Tab = "info" | "scores" | "sessions" | "files" | "progress";

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
  const classes = api.classes ?? [];
  return {
    id: api.id,
    initials: initials(fullName),
    avatarColor: "#0E9F8E",
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

/* ─── combine address + district + province into one display line ─── */
function fmtAddress(
  address?: string | null,
  district?: string | null,
  province?: string | null,
) {
  return [address, district, province].filter(Boolean).join(", ") || null;
}

/* ─── Info row ─── */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[#EEF3F1] last:border-0">
      <span className="text-sm text-[#9AAEA9] shrink-0 w-36">{label}</span>
      <span className="text-sm font-semibold text-[#16302b] text-right">
        {value || "—"}
      </span>
    </div>
  );
}

export default function StudentDetailPage() {
  const copy = useStudentsCopy();
  const params = useParams<{ id: string }>();
  const studentId = params.id;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("info");
  const [editing, setEditing] = useState(false);
  // PUT /students/:id is ADMIN-only on the gateway; TUTOR can view but not edit.
  const isAdmin = useCurrentUserRole() === "ADMIN";

  const tabs = useMemo<{ id: Tab; label: string }[]>(
    () => [
      { id: "info", label: copy.detail.tabs.info },
      { id: "scores", label: copy.detail.tabs.scores },
      { id: "sessions", label: copy.detail.tabs.sessions },
      { id: "files", label: copy.detail.tabs.files },
      { id: "progress", label: copy.detail.tabs.progress },
    ],
    [copy],
  );

  const genderLabel: Record<string, string> = useMemo(
    () => ({
      MALE: copy.detail.genderLabels.male,
      FEMALE: copy.detail.genderLabels.female,
      OTHER: copy.detail.genderLabels.other,
    }),
    [copy],
  );

  const {
    data: apiStudent,
    isLoading: studentLoading,
    error: studentError,
  } = useStudentActions({
    detailId: studentId,
    detailOptions: { enabled: !!studentId },
  }).detail;

  const student = useMemo(
    () => (apiStudent ? mapApiToStudent(apiStudent) : null),
    [apiStudent],
  );

  const { data: exercises, isLoading: exercisesLoading } = useExerciseActions(
    {
      list: { studentId, limit: 100 },
      listOptions: { enabled: !!studentId },
    },
  ).list;

  const exercisesList = exercises ?? [];

  const gradedExercises = useMemo(
    () =>
      exercisesList.filter((e) => e.status === "GRADED" && e.score !== null),
    [exercisesList],
  );

  const avgScore = useMemo(() => {
    if (gradedExercises.length === 0) return null;
    const sum = gradedExercises.reduce((acc, e) => acc + (e.score ?? 0), 0);
    return Math.round((sum / gradedExercises.length) * 10) / 10;
  }, [gradedExercises]);

  const submittedFiles = useMemo(
    () => exercisesList.flatMap((e) => e.exerciseUrls),
    [exercisesList],
  );

  const invalidateStudent = () => {
    queryClient.invalidateQueries({ queryKey: ["student-detail", studentId] });
    queryClient.invalidateQueries({
      queryKey: ["student-exercises", studentId],
    });
  };

  if (studentLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-[#9AAEA9]" />
      </div>
    );
  }

  if (studentError || !student) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <XCircle className="size-10 text-red-500" />
        <p className="mt-3 text-sm font-medium text-[#9AAEA9]">
          {getErrorMessage(studentError) || copy.detail.loadError}
        </p>
        <Link
          href="/students"
          className="mt-4 text-sm font-medium text-[#0E9F8E] hover:underline"
        >
          {copy.detail.backToList}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Breadcrumb + actions ── */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-sm">
          <Link
            href="/students"
            className="text-[#9AAEA9] hover:text-[#0E9F8E] transition-colors"
          >
            {copy.detail.breadcrumbStudents}
          </Link>
          <ChevronRight className="size-3.5 text-[#9AAEA9]" />
          <span className="font-semibold text-[#16302b]">{student.name}</span>
        </nav>
        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-lg border border-[#E7EEEC] bg-white px-4 py-2 text-sm font-medium text-[#16302b] hover:bg-[#F3F7F5] transition-colors shadow-sm"
            >
              <Pencil className="size-3.5" />
              {copy.detail.editProfile}
            </button>
          )}
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-[#0E9F8E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b7a6d] transition-colors shadow-sm"
          >
            <MessageCircle className="size-3.5" />
            {copy.detail.messageParent}
          </button>
        </div>
      </div>

      {/* ── Profile card ── */}
      <div className="rounded-xl border border-[#E7EEEC] bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          {/* Left: avatar + info */}
          <div className="flex items-center gap-4">
            <div
              className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
              style={{ backgroundColor: student.avatarColor }}
            >
              {student.initials}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-[#16302b]">
                  {student.name}
                </h1>
                {student.studentId && (
                  <span className="rounded-md bg-[#F3F7F5] px-2 py-0.5 text-xs font-semibold text-[#9AAEA9]">
                    {student.studentId}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-4 text-sm text-[#9AAEA9]">
                {student.classCode && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="size-3.5" />
                    {student.classCode}
                  </span>
                )}
                {student.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    {student.phone}
                  </span>
                )}
                {apiStudent?.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    {apiStudent.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: stats */}
          <div className="flex shrink-0 items-center gap-8 border-l border-[#EEF3F1] pl-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#0E9F8E]">
                {avgScore ?? "—"}
              </p>
              <p className="mt-0.5 text-xs text-[#9AAEA9]">
                {copy.detail.statAvgScore}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#16302b]">
                {exercisesList.length}
              </p>
              <p className="mt-0.5 text-xs text-[#9AAEA9]">
                {copy.detail.statSubmitted}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#F97316]">
                {gradedExercises.length}
              </p>
              <p className="mt-0.5 text-xs text-[#9AAEA9]">
                {copy.detail.statGraded}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0 border-b border-[#E7EEEC]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "text-[#0E9F8E]"
                : "text-[#9AAEA9] hover:text-[#16302b]"
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#0E9F8E]" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === "info" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Student info */}
          <div className="rounded-xl border border-[#E7EEEC] bg-white p-5 shadow-sm">
            <h3 className="mb-1 font-semibold text-[#16302b]">
              {copy.detail.studentInfoTitle}
            </h3>
            <div className="mt-3">
              <InfoRow
                label={copy.detail.infoLabels.fullName}
                value={student.name}
              />
              <InfoRow
                label={copy.detail.infoLabels.studentCode}
                value={student.studentId}
              />
              <InfoRow
                label={copy.detail.infoLabels.gender}
                value={student.gender ? genderLabel[student.gender] : null}
              />
              <InfoRow
                label={copy.detail.infoLabels.dob}
                value={fmtDate(student.dateOfBirth)}
              />
              <InfoRow
                label={copy.detail.infoLabels.school}
                value={student.school}
              />
              <InfoRow
                label={copy.detail.infoLabels.phone}
                value={student.phone}
              />
              <InfoRow
                label={copy.detail.infoLabels.email}
                value={apiStudent?.email}
              />
              <InfoRow
                label={copy.detail.infoLabels.address}
                value={fmtAddress(
                  student.address,
                  student.district,
                  student.province,
                )}
              />
            </div>
          </div>

          {/* Parent info */}
          <div className="rounded-xl border border-[#E7EEEC] bg-white p-5 shadow-sm">
            <h3 className="mb-1 font-semibold text-[#16302b]">
              {copy.detail.parentInfoTitle}
            </h3>
            <div className="mt-3">
              <InfoRow
                label={copy.detail.infoLabels.fullName}
                value={student.parentName}
              />
              <InfoRow
                label={copy.detail.infoLabels.relationship}
                value={student.parentRelationship}
              />
              <InfoRow
                label={copy.detail.infoLabels.phone}
                value={student.parentPhone}
              />
              <InfoRow
                label={copy.detail.infoLabels.email}
                value={student.parentEmail}
              />
              <InfoRow
                label={copy.detail.infoLabels.address}
                value={fmtAddress(
                  student.parentAddress,
                  student.parentDistrict,
                  student.parentProvince,
                )}
              />
              <InfoRow
                label={copy.detail.classesEnrolledLabel}
                value={student.classCode}
              />
            </div>
          </div>
        </div>
      )}

      {tab === "scores" && (
        <div className="overflow-hidden rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
          {exercisesLoading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="size-5 animate-spin text-[#9AAEA9]" />
            </div>
          ) : gradedExercises.length === 0 ? (
            <p className="py-14 text-center text-[#9AAEA9]">
              {copy.detail.scoresEmpty}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E7EEEC] bg-[#F3F7F5]">
                  {[
                    copy.detail.scoresTable.gradedDate,
                    copy.detail.scoresTable.score,
                    copy.detail.scoresTable.comment,
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gradedExercises.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-[#EEF3F1] last:border-0 hover:bg-[#F1FBF9] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#9AAEA9]">
                      {fmtDateTime(e.gradedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${
                          (e.score ?? 0) >= 8
                            ? "text-[#0E9F8E]"
                            : (e.score ?? 0) >= 6
                              ? "text-[#F59E0B]"
                              : "text-[#EF4444]"
                        }`}
                      >
                        {e.score}
                      </span>
                      <span className="text-[#9AAEA9]">/10</span>
                    </td>
                    <td className="px-4 py-3 text-[#9AAEA9]">
                      {e.comment || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "sessions" && (
        <div className="overflow-hidden rounded-xl border border-[#E7EEEC] bg-white shadow-sm">
          {exercisesLoading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="size-5 animate-spin text-[#9AAEA9]" />
            </div>
          ) : exercisesList.length === 0 ? (
            <p className="py-14 text-center text-[#9AAEA9]">
              {copy.detail.sessionsEmpty}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E7EEEC] bg-[#F3F7F5]">
                  {[
                    copy.detail.sessionsTable.submittedDate,
                    copy.detail.sessionsTable.status,
                    copy.detail.sessionsTable.score,
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exercisesList.map((e) => {
                  const meta = EXERCISE_STATUS_META[e.status];
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-[#EEF3F1] last:border-0 hover:bg-[#F1FBF9] transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-[#16302b]">
                        {fmtDateTime(e.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={meta.label}
                          className={meta.className}
                        />
                      </td>
                      <td className="px-4 py-3 text-[#16302b]">
                        {e.score ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "files" && (
        <div className="rounded-xl border border-[#E7EEEC] bg-white p-5 shadow-sm">
          {exercisesLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-[#9AAEA9]" />
            </div>
          ) : submittedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-[#F3F7F5]">
                <BookOpen className="size-5 text-[#9AAEA9]" />
              </div>
              <p className="mt-3 text-sm font-medium text-[#16302b]">
                {copy.detail.filesEmptyTitle}
              </p>
              <p className="mt-1 text-xs text-[#9AAEA9]">
                {copy.detail.filesEmptyBody}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {submittedFiles.map((f) => (
                <DownloadFileRow key={f.key} file={f} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "progress" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: copy.detail.progress.avgScoreLabel,
              value: avgScore !== null ? `${avgScore}/10` : "—",
              sub: `${copy.detail.progress.avgScoreSubPrefix}${gradedExercises.length}${copy.detail.progress.avgScoreSubSuffix}`,
              color: "#0E9F8E",
              icon: ClipboardCheck,
            },
            {
              label: copy.detail.progress.totalSubmittedLabel,
              value: String(exercisesList.length),
              sub: `${gradedExercises.length}${copy.detail.progress.gradedSuffix} · ${
                exercisesList.length - gradedExercises.length
              }${copy.detail.progress.pendingSuffix}`,
              color: "#2563EB",
              icon: BookOpen,
            },
            {
              label: copy.detail.classesEnrolledLabel,
              value: student.classCode || copy.detail.classCodeZero,
              sub: copy.detail.progress.classCountSub,
              color: "#F97316",
              icon: BookOpen,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#E7EEEC] bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                {stat.label}
              </p>
              <p
                className="mt-2 text-3xl font-bold"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-[#9AAEA9]">{stat.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Edit student dialog ── */}
      {editing && (
        <EditStudentDialog
          student={student}
          onClose={() => setEditing(false)}
          onSaved={invalidateStudent}
        />
      )}
    </div>
  );
}
