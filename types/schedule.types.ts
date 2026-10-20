/** Lịch học cố định (weekly schedule) — backed by `/schedules` on the API. */

/** `dayOfWeek` is the uppercase English enum (`MONDAY`...`SUNDAY`), not a number 1-7. */
export type SchedulePayload = {
  classId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  format?: string;
  location?: string;
};

export type BulkSchedulePayload = {
  classId: string;
  schedules: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    format?: string;
    location?: string;
  }>;
};

/* ─── Calendar-specific API types ─── */

export type ScheduleDayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type ScheduleFormat = "ONLINE" | "OFFLINE";

export interface ApiScheduleClass {
  id: string;
  name: string;
  code: string;
  subject: string;
  status: string;
}

export interface ApiSchedule {
  id: string;
  classId: string;
  dayOfWeek: ScheduleDayOfWeek;
  startTime: string;
  endTime: string;
  format: ScheduleFormat;
  location: string | null;
  class: ApiScheduleClass | null;
}

export interface CalendarSession {
  time: string;
  classCode: string;
  schedule: ApiSchedule;
}

export type ViewMode = "month" | "week" | "day";

/** Row lịch học trả về từ `GET /schedules*` (gồm thông tin lớp). */
export type ScheduleItem = ApiSchedule;
