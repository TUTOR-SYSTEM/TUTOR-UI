import { toast } from "sonner";

import { axiosInstance, getErrorMessage } from "@/lib/axios";

/**
 * Lấy nội dung một tệp đã lưu trên R2 theo `key`. Đi qua route cùng origin
 * `/api/files/download` (xem app/api/files/download/route.ts) — không gọi thẳng gateway vì
 * gateway redirect 302 sang R2 và trình duyệt chặn response đó bởi CORS.
 */
export async function fetchStoredFileBlob(key: string): Promise<Blob> {
  const res = await axiosInstance.get<Blob>(
    `${window.location.origin}/api/files/download`,
    {
      params: { key },
      responseType: "blob",
    },
  );
  return res.data;
}

function saveBlob(blob: Blob, name: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

/**
 * Tải một tệp đã lưu trên R2 theo `key`.
 * Lỗi (403/404/mạng...) được hiện bằng toast thay vì để promise bị reject không ai bắt
 * (trước đây làm Runtime Error ngay trên trang). Trả về `true` khi tải thành công.
 */
export async function downloadStoredFile(key: string, name: string): Promise<boolean> {
  try {
    saveBlob(await fetchStoredFileBlob(key), name);
    return true;
  } catch (err) {
    toast.error(getErrorMessage(err, "Tải tệp thất bại"));
    return false;
  }
}

export { saveBlob };
