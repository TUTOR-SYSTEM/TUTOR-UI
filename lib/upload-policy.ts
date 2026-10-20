import type { UserRole } from "@/lib/rbac/roles";

/** Số file tối đa mỗi lần upload (khớp `MAX_FILES_PER_REQUEST` ở gateway). */
export const MAX_FILES_PER_UPLOAD = 5;

/** Chỉ ADMIN/TUTOR được upload file (gateway `POST /upload*` → 403 cho role khác). */
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
