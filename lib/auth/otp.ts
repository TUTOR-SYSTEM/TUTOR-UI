/** Số chữ số của mã đặt lại mật khẩu. Khớp `^\d{6}$` ở BE (`user` / `gateway`). */
export const OTP_LENGTH = 6;

/** Thời gian chờ trước khi được gửi lại mã (giây). */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/** Chỉ giữ chữ số và cắt còn tối đa `OTP_LENGTH` ký tự (dùng cho ô nhập và khi dán mã). */
export function normalizeOtp(value: string): string {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

/** `true` khi đủ đúng `OTP_LENGTH` chữ số. */
export function isCompleteOtp(value: string): boolean {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(value);
}
