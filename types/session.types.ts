/** Buổi học (class session) + bài tập (exercise submission) domain types. */

export type SessionStatus =
  | "SCHEDULED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED"
  | "POSTPONED";

export type SessionFile = { name: string; url: string; key: string };

/** One entry of the "Nội dung buổi học" timestamped agenda. */
export type SessionAgendaItem = {
  time: string;
  title: string;
  description?: string;
};

/** Compact session row used in the class-detail upcoming/past session tables. */
export type SessionDto = {
  id: string;
  lessonId: string | null;
  status: SessionStatus;
  sessionNumber?: number;
  title?: string | null;
  startAt?: string;
  endAt?: string;
  location?: string | null;
};

export type SessionClassInfo = {
  id: string;
  name: string;
  code: string;
  subject: string;
  curriculumId?: string | null;
  tutorId?: string;
};

/** A row in the student's list of buổi học (includes a compact class object). */
export type StudentSessionListItem = {
  id: string;
  classId: string;
  lessonId: string | null;
  tutorId: string | null;
  title: string | null;
  description: string | null;
  sessionNumber: number;
  theoryUrls: SessionFile[];
  exerciseUrls: SessionFile[];
  startAt: string;
  endAt: string;
  location: string | null;
  status: SessionStatus;
  note: string | null;
  objectives: string[];
  agenda: SessionAgendaItem[];
  exerciseDueAt: string | null;
  createdAt: string;
  updatedAt: string;
  class: { id: string; name: string; code: string; subject: string };
};

/** Full session detail returned for an enrolled student. */
export type StudentSessionDetail = Omit<StudentSessionListItem, "class"> & {
  actualStartAt: string | null;
  actualEndAt: string | null;
  class: SessionClassInfo;
  lesson: { id: string; title: string; chapterTitle: string | null } | null;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type StudentSessionsResponse = {
  sessions: StudentSessionListItem[];
  pagination: Pagination;
};

/** `POST /sessions` body — gateway `createSessionSchema` (`startAt`, `endAt`, `sessionNumber` required). */
export type CreateSessionPayload = {
  classId: string;
  sessionNumber: number;
  startAt: string;
  endAt: string;
  title?: string;
  description?: string;
  location?: string;
};

/** `PUT /sessions/:id` body — gateway `updateSessionSchema` (all optional). */
export type UpdateSessionPayload = Partial<
  Omit<CreateSessionPayload, "classId" | "sessionNumber">
> & {
  sessionNumber?: number;
  status?: SessionStatus;
  lessonId?: string | null;
  note?: string;
  objectives?: string[];
  agenda?: SessionAgendaItem[];
  exerciseDueAt?: string | null;
};

/** Một buổi trong `POST /sessions/bulk` — khớp `createSessionSchema` ở BE (`startAt`/`endAt` là ISO). */
export type BulkSessionItemPayload = {
  sessionNumber: number;
  startAt: string;
  endAt: string;
  title?: string;
  description?: string;
  location?: string;
};

export type BulkSessionPayload = {
  classId: string;
  sessions: BulkSessionItemPayload[];
};

/* ─── Bài tập / bài làm (exercise) ─── */

export type ExerciseStatus = "SUBMITTED" | "GRADED" | "RESUBMIT";

export type ExerciseDetail = {
  id: string;
  lessonId: string | null;
  sessionId: string | null;
  tutorId: string;
  studentId: string;
  issueUrls: SessionFile[];
  exerciseUrls: SessionFile[];
  status: ExerciseStatus;
  score: number | null;
  comment: string | null;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExercisesResponse = {
  data: ExerciseDetail[];
  pagination: Pagination;
};

/** Khớp `createExerciseSchema` ở BE. `tutorId`/`studentId` bắt buộc (UUID). */
export type CreateExercisePayload = {
  tutorId: string;
  studentId: string;
  sessionId?: string | null;
  lessonId?: string | null;
  issueUrls?: SessionFile[] | null;
  exerciseUrls?: SessionFile[] | null;
  status?: ExerciseStatus;
};

/** Khớp `submitExerciseSchema` ở BE: nộp lại cần ít nhất một file bài làm. */
export type ResubmitExercisePayload = {
  exerciseUrls: SessionFile[];
};

export type GradeExercisePayload = {
  score: number;
  comment?: string;
};

/** Response shape of `POST /upload`. */
export type UploadResult = {
  url: string;
  key: string;
  size: number;
  mimetype: string;
};
