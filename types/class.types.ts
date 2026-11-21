export type ClassStatus = "OPEN" | "CLOSED" | "UPCOMING";
export type DisplayStatus = "active" | "upcoming" | "completed";

/** UI-level display status used by the class list page (maps CLOSED → paused). */
export type ClassDisplayStatus = "active" | "paused" | "upcoming";

export type ClassFormat = "ONLINE" | "OFFLINE";

/** Weekly recurring schedule slot returned by `GET /classes`. */
export type ApiClassSchedule = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  format?: string | null;
  location?: string | null;
};

/** Enrolled student row returned by `GET /classes` (list context). */
export type ApiClassStudent = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  userCode: string | null;
};

/** Session row returned by `GET /classes` (only the count is used in the list). */
export type ApiClassSession = {
  id: string;
};

/** Upcoming session summary attached to a class list row. */
export type ApiClassNextSession = {
  id: string;
  title: string | null;
  sessionNumber: number;
  startAt: string;
  endAt: string;
  status: string;
  location: string | null;
};

/** Raw class row as returned by `GET /classes`. */
export type ApiClassRow = {
  id: string;
  /** Managing tutor id. */
  tutorId?: string;
  /** Sĩ số tối đa: 1 = 1 kèm 1, 10 = lớp nhóm. */
  maxStudents?: number | null;
  name: string;
  code: string;
  subject: string;
  tuition: string | null;
  description: string | null;
  status: ClassStatus | null;
  format: string | null;
  location: string | null;
  startTime: string | null;
  endTime: string | null;
  curriculumId: string | null;
  sessions: ApiClassSession[] | null;
  students: ApiClassStudent[] | null;
  schedules: ApiClassSchedule[] | null;
  nextSession: ApiClassNextSession | null;
};

/** Paginated response of `GET /classes`. */
export type ClassesApiPayload = {
  classes: ApiClassRow[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/** UI view-model for a class list row. */
export type ClassItem = {
  id: string;
  code: string;
  name: string;
  subject: string;
  feePerSession: number;
  description: string;
  studentCount: number;
  students: ApiClassStudent[];
  sessionCount: number;
  nextSession: ApiClassNextSession | null;
  /** Weekly schedule grouped by distinct time range (days can have different times). */
  scheduleGroups: { days: string; time: string }[];
  status: ClassDisplayStatus;
  curriculumId: string;
  curriculumTitle: string;
  format: string;
  location: string;
  startTime: string;
  endTime: string;
};

/** Filter state for class list status tabs. */
export type ClassStatusFilter = ClassDisplayStatus | "all";

// ─── Detail / Dialog types ──────────────────────────────────────────────────

export type ClassDetailDto = {
  id: string;
  name: string;
  code: string;
  subject: string;
  tuition: string;
  description: string | null;
  status: ClassStatus;
  tutorId: string;
  studentCount: number;
  sessionCount: number;
  upcomingSessionCount: number;
  curriculumId: string | null;
  /** "ONLINE" | "OFFLINE" — same field as the `/classes` list row. */
  format: string | null;
  location: string | null;
  /** Program start/end date (ISO) — NOT a daily time-of-day; weekly time slots live on `/schedules`. */
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClassParentDto = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  relationship: string | null;
};

export type ClassStudentDto = {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  userCode: string | null;
  phone: string | null;
  parent: ClassParentDto | null;
};

export type ClassesProps = {
  classItem: {
    id: string;
    /** Gia sư quản lý lớp (ADMIN đổi được; TUTOR chỉ xem). */
    tutorId?: string | null;
    /** Sĩ số tối đa: 1 = 1 kèm 1, 10 = lớp nhóm. */
    maxStudents?: number | null;
    name: string;
    subject: string;
    feePerSession: number;
    description: string;
    status: string;
    curriculumId: string;
    format: string;
    location: string;
    startTime: string;
    endTime: string;
  } | null;
  onClose: () => void;
};

export type FormState = {
  name: string;
  /** Gia sư quản lý (ADMIN chọn được khi sửa lớp). */
  tutorId: string;
  subject: string;
  feePerSession: number;
  description: string;
  status: string;
  curriculumId: string;
  format: ClassFormat;
  onlineLocation: string;
  offlineLocation: string;
  startDate: string;
  endDate: string;
};
