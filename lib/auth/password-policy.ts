import { z } from "zod";

/** Độ dài mật khẩu dùng chung: tạo tài khoản, đổi mật khẩu, đặt lại mật khẩu. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;

/** Mật khẩu mới (register / reset / đổi mật khẩu). Khớp chính sách 8–100 của BE. */
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .max(PASSWORD_MAX_LENGTH);

/**
 * Đăng nhập: không ép tối thiểu — tài khoản cũ có thể đặt mật khẩu ngắn hơn 8 ký tự và vẫn phải
 * đăng nhập được. Chỉ chặn rỗng và quá dài.
 */
export const loginPasswordSchema = z
  .string()
  .min(1)
  .max(PASSWORD_MAX_LENGTH);

/** Trả thông báo lỗi cho mật khẩu mới, hoặc `null` nếu hợp lệ. */
export function newPasswordError(
  value: string,
  messages: { tooShort: string; tooLong: string },
): string | null {
  const result = newPasswordSchema.safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.code === "too_big"
    ? messages.tooLong
    : messages.tooShort;
}

/** Trả thông báo lỗi cho mật khẩu đăng nhập, hoặc `null` nếu hợp lệ. */
export function loginPasswordError(
  value: string,
  messages: { required: string; tooLong: string },
): string | null {
  const result = loginPasswordSchema.safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.code === "too_big"
    ? messages.tooLong
    : messages.required;
}
