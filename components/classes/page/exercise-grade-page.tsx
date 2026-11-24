"use client";

import { currentPersonName } from "@/lib/format/person-name";
import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { useGet } from "@/lib/axios/query";
import { getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import type {
  ExerciseDetail,
  ExercisesResponse,
} from "@/types/session.types";
import { GradeWorkspace } from "../components/exercise-grade-workspace";

/* ─── Types ─── */

type SessionInfo = {
  id: string;
  title: string | null;
  sessionNumber: number;
  class: { id: string; name: string; code: string; subject: string };
  lesson: { id: string; title: string } | null;
};

type ClassStudentDto = {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  userCode: string | null;
};

/* ─── Main page ─── */

export const ExerciseGradePage = ({
  classId,
  sessionId,
  exerciseId,
}: {
  classId: string;
  sessionId: string;
  exerciseId: string;
}) => {
  const router = useRouter();
  const role = useCurrentUserRole();
  const currentUserId = useCurrentUserId();
  const isTutor = role === "TUTOR";

  /* ── Data: session, class roster, all submissions for this session ── */
  const {
    data: sessionRaw,
    isLoading: sessionLoading,
    error: sessionError,
  } = useGet(["session-detail", sessionId], `/sessions/${sessionId}`, {
    enabled: !!sessionId,
  });
  const session = useMemo(
    () => (sessionRaw ? unwrapApiData<SessionInfo>(sessionRaw) : null),
    [sessionRaw],
  );

  const { data: studentsRaw } = useGet(
    ["class-students", classId],
    `/classes/${classId}/students`,
    { enabled: !!classId },
  );
  const students = useMemo<ClassStudentDto[]>(
    () =>
      studentsRaw ? (unwrapApiData<ClassStudentDto[]>(studentsRaw) ?? []) : [],
    [studentsRaw],
  );

  const exercisesKey = ["session-exercises", sessionId] as const;
  const { data: exercisesRaw, isLoading: exercisesLoading } = useGet(
    exercisesKey,
    "/exercises",
    { params: { sessionId, limit: 100 }, enabled: !!sessionId },
  );
  const exerciseList = useMemo<ExerciseDetail[]>(() => {
    if (!exercisesRaw) return [];
    return unwrapApiData<ExercisesResponse>(exercisesRaw).data ?? [];
  }, [exercisesRaw]);

  const submissionByStudent = useMemo(() => {
    const map: Record<string, ExerciseDetail> = {};
    for (const ex of exerciseList) map[ex.studentId] = ex;
    return map;
  }, [exerciseList]);

  const exercise = useMemo(
    () => exerciseList.find((e) => e.id === exerciseId) ?? null,
    [exerciseList, exerciseId],
  );

  const student = useMemo(
    () =>
      exercise
        ? (students.find((s) => s.id === exercise.studentId) ?? null)
        : null,
    [students, exercise],
  );

  const orderedGraders = useMemo(
    () => students.filter((s) => submissionByStudent[s.id]),
    [students, submissionByStudent],
  );
  const currentIndex = exercise
    ? orderedGraders.findIndex((s) => s.id === exercise.studentId)
    : -1;
  const prevExercise =
    currentIndex > 0
      ? submissionByStudent[orderedGraders[currentIndex - 1].id]
      : null;
  const nextExercise =
    currentIndex >= 0 && currentIndex < orderedGraders.length - 1
      ? submissionByStudent[orderedGraders[currentIndex + 1].id]
      : null;
  const nextUngraded = useMemo(() => {
    if (currentIndex < 0) return null;
    for (let i = currentIndex + 1; i < orderedGraders.length; i++) {
      const ex = submissionByStudent[orderedGraders[i].id];
      if (ex && ex.status !== "GRADED") return ex;
    }
    return null;
  }, [currentIndex, orderedGraders, submissionByStudent]);

  const goTo = (id: string) =>
    router.push(`/classes/${classId}/sessions/${sessionId}/submissions/${id}`);
  const backHref = isTutor
    ? `/classes/${classId}/sessions/${sessionId}/submissions`
    : `/classes/${classId}/sessions/${sessionId}/exercise`;

  /* ── Loading / error / access states ── */
  const loading = sessionLoading || exercisesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sessionError || !session || !exercise || !student) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <XCircle className="size-10 text-red-500" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          {getErrorMessage(sessionError) || "Không tìm thấy bài nộp cần chấm"}
        </p>
        <Link
          href={backHref}
          className="mt-4 text-sm font-medium text-primary transition-opacity hover:opacity-75"
        >
          Quay lại
        </Link>
      </div>
    );
  }

  /* Admin chỉ xem (read-only), học sinh chỉ xem bài của mình. */
  const isAdmin = role === "ADMIN";
  if (!isTutor && !isAdmin && exercise.studentId !== currentUserId) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <XCircle className="size-10 text-red-500" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Bạn không có quyền xem bài chấm này
        </p>
        <Link
          href={backHref}
          className="mt-4 text-sm font-medium text-primary transition-opacity hover:opacity-75"
        >
          Quay lại
        </Link>
      </div>
    );
  }

  const studentName = currentPersonName(student.firstName, student.lastName).trim();
  const lessonLabel =
    session.lesson?.title || session.title || session.class.name;

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href={backHref} className="hover:text-foreground">
            <ChevronLeft className="size-4" />
          </Link>
          <Link href={backHref} className="hover:text-foreground">
            {lessonLabel} — Buổi {session.sessionNumber}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="font-semibold text-foreground">
            {isTutor ? `Chấm bài · ${studentName}` : "Chi tiết bài chấm"}
          </span>
        </nav>
        {isTutor && orderedGraders.length > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full!"
              disabled={!prevExercise}
              onClick={() => prevExercise && goTo(prevExercise.id)}
              aria-label="Học sinh trước"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full!"
              disabled={!nextExercise}
              onClick={() => nextExercise && goTo(nextExercise.id)}
              aria-label="Học sinh sau"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <GradeWorkspace
        key={exercise.id}
        exercise={exercise}
        student={student}
        studentIndex={Math.max(currentIndex, 0)}
        isTutor={isTutor}
        backHref={backHref}
        exercisesKey={exercisesKey}
        nextUngraded={nextUngraded}
        goTo={goTo}
      />
    </div>
  );
};
