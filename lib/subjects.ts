/**
 * Canonical list of teachable subjects (môn dạy) used by the tutor/admin forms.
 * Stored on the backend as a comma-joined string; exposed through the admin API
 * as an array of these labels.
 */
export const SUBJECT_OPTIONS = [
  "Toán",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Ngữ văn",
  "Tiếng Anh",
  "Lịch sử",
  "Địa lý",
  "GDCD",
  "Tin học",
  "Công nghệ",
] as const;

export type SubjectOption = (typeof SUBJECT_OPTIONS)[number];

