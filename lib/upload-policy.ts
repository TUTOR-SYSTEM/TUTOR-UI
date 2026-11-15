import type { UserRole } from "@/lib/rbac/roles";

/** Số file tối đa mỗi lần upload (khớp `MAX_FILES_PER_REQUEST` ở gateway). */
export const MAX_FILES_PER_UPLOAD = 5;

/**
 * Ai được upload tài liệu/đáp án theo nút trên UI: ADMIN/TUTOR. Học sinh upload bài nộp qua
 * trang nộp bài (BE lưu vào thư mục `submissions/`); PARENT không upload (gateway → 403).
 */
export function canUploadFiles(role: UserRole | null | undefined): boolean {
  return role === "ADMIN" || role === "TUTOR";
}

/** Lấy tối đa `MAX_FILES_PER_UPLOAD` file từ lựa chọn của người dùng. */
export function pickUploadFiles(
  files: FileList | readonly File[] | null | undefined,
): File[] {
  if (!files) return [];
  return Array.from(files).slice(0, MAX_FILES_PER_UPLOAD);
}
