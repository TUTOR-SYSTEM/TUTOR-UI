/**
 * `redirectUrl` của thông báo chỉ được dùng làm link khi là đường dẫn nội bộ (bắt đầu bằng một
 * `/` đơn, không phải `//` hay `/\`, không ký tự điều khiển) hoặc `https://`. Gateway/third đã
 * kiểm tra whitelist host; đây là lớp phòng thủ thứ hai ở FE. Trả `null` nếu không hợp lệ.
 */
export function safeRedirectHref(value: string | null | undefined): string | null {
  if (!value) return null;
  // Tab / newline / ký tự điều khiển trình duyệt sẽ bỏ đi (vd `/\t/evil.com` → `//evil.com`).
  if (/[\u0000-\u001F\u007F\s]/.test(value)) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
