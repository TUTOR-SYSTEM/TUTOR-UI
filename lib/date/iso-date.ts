/**
 * Helpers cho giá trị ngày dạng `yyyy-mm-dd` (chuỗi input date / payload BE).
 * Mọi thao tác dùng ngày địa phương để tránh lệch múi giờ khi parse chuỗi ISO.
 */

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse `yyyy-mm-dd` thành Date địa phương (00:00). Trả về null nếu chuỗi không hợp lệ. */
export function parseIsoDate(value: string): Date | null {
  const m = ISO_RE.exec(value);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format Date địa phương thành `yyyy-mm-dd`. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Lưới tháng: 6 hàng × 7 cột, tuần bắt đầu Thứ Hai. Ô ngoài tháng là null. */
export function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  // getDay(): 0 = CN … 6 = T7 → đổi sang offset tính từ Thứ Hai.
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}
