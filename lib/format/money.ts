/**
 * Định dạng số tiền nhập tay: thêm dấu "." ngăn cách hàng nghìn (kiểu VN, vd 200.000).
 * Chỉ giữ chữ số; chuỗi rỗng trả về rỗng.
 */
export function formatThousands(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Lấy lại chuỗi chữ số thuần từ giá trị đã định dạng (vd "200.000" → "200000"). */
export function stripThousands(value: string): string {
  return value.replace(/\D/g, "");
}
