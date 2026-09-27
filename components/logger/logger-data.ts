import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/axios/query";
import type { ApiResponse, LogServiceName } from "@/types";

/** HTTP method nào có body — dùng để quyết định có show/parse ô body khi gửi lại request. */
export const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH"]);

/** Gửi lại một request đã log qua đúng method — dùng chung giữa bảng list và dialog trace. */
export function sendReplay(method: string, path: string, body: unknown) {
  switch (method) {
    case "GET":
      return apiGet<ApiResponse<unknown>>(path);
    case "DELETE":
      return apiDelete<ApiResponse<unknown>>(path);
    case "POST":
      return apiPost<ApiResponse<unknown>, unknown>(path, body);
    case "PUT":
      return apiPut<ApiResponse<unknown>, unknown>(path, body);
    case "PATCH":
      return apiPatch<ApiResponse<unknown>, unknown>(path, body);
    default:
      return Promise.reject(new Error(`Unsupported method: ${method}`));
  }
}

/** Ngưỡng (ms) coi một hop là "chậm" — tô đỏ/cam cột Thời lượng trong bảng list. */
export const SLOW_DURATION_THRESHOLD_MS = 500;

/** Màu badge cố định theo service — 4 giá trị `serviceName` thực tế BE trả về. */
export const SERVICE_COLOR: Record<
  LogServiceName,
  { bg: string; text: string }
> = {
  gateway: { bg: "#F3E8FF", text: "#7C3AED" },
  "tutor-service": { bg: "#E4F6EF", text: "#0B7A6D" },
  "user-service": { bg: "#DBEAFE", text: "#2563EB" },
  "third-service": { bg: "#FFF0E6", text: "#E85D24" },
};

export const DEFAULT_SERVICE_COLOR = { bg: "#F3F7F5", text: "#5C726D" };

export function getServiceColor(serviceName: string) {
  return (
    SERVICE_COLOR[serviceName as LogServiceName] ?? DEFAULT_SERVICE_COLOR
  );
}

export function isErrorLog(log: {
  statusCode?: number | null;
  errorMessage?: string | null;
}): boolean {
  return (
    (typeof log.statusCode === "number" && log.statusCode >= 400) ||
    !!log.errorMessage
  );
}

export function getStatusColor(statusCode?: number | null): {
  bg: string;
  text: string;
} {
  if (statusCode == null) return DEFAULT_SERVICE_COLOR;
  if (statusCode >= 500) return { bg: "#FEE2E2", text: "#DC2626" };
  if (statusCode >= 400) return { bg: "#FFF0E6", text: "#E85D24" };
  return { bg: "#E4F6EF", text: "#0B7A6D" };
}

/**
 * Field nhạy cảm mà BE cố tình ghi đè bằng placeholder trước khi lưu log — giá
 * trị gốc KHÔNG được lưu ở đâu (đúng thực hành bảo mật), nên không thể "hiện
 * lại" mật khẩu thật của lần gửi trước; chỉ có thể yêu cầu người dùng tự nhập
 * lại giá trị thật trước khi gửi lại request.
 */
export const SENSITIVE_BODY_KEYS = new Set([
  "password",
  "oldpassword",
  "newpassword",
  "confirmpassword",
  "currentpassword",
  "secret",
  "token",
  "accesstoken",
  "refreshtoken",
]);

export const REDACTED_PLACEHOLDER = "[REDACTED]";

/** Các key top-level trong 1 JSON body string đang mang giá trị `[REDACTED]`. */
export function findRedactedKeys(bodyJson: string): string[] {
  if (!bodyJson.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(bodyJson);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
    return Object.entries(parsed as Record<string, unknown>)
      .filter(
        ([key, value]) =>
          SENSITIVE_BODY_KEYS.has(key.toLowerCase()) &&
          value === REDACTED_PLACEHOLDER,
      )
      .map(([key]) => key);
  } catch {
    return [];
  }
}

/** Field theo tên (không phân biệt hoa/thường) có phải kiểu nhạy cảm không — dùng để
 * quyết định hiện ô nhập dạng password (che giá trị) trong form gửi lại request. */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_BODY_KEYS.has(key.toLowerCase());
}

export type BodyFieldKind = "string" | "number" | "boolean" | "json";

export type BodyField = {
  key: string;
  kind: BodyFieldKind;
  value: string;
  sensitive: boolean;
};

/** Key giả dùng khi request body không phải object phẳng (mảng/kiểu nguyên thuỷ/parse
 * lỗi) — cả body lúc đó gộp vào đúng 1 field JSON thô thay vì tách theo từng key. */
export const RAW_BODY_FIELD_KEY = "__raw__";

function detectFieldKind(value: unknown): BodyFieldKind {
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "json";
}

/** Parse 1 request body (JSON string) thành danh sách field để render form nhập
 * từng field riêng — mỗi top-level key thành 1 field; field nhạy cảm đã bị BE
 * redact (`[REDACTED]`) được reset về rỗng để bắt buộc nhập lại giá trị thật. */
export function parseBodyFields(raw?: string | null): BodyField[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [{ key: RAW_BODY_FIELD_KEY, kind: "json", value: raw, sensitive: false }];
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return [
      {
        key: RAW_BODY_FIELD_KEY,
        kind: "json",
        value: JSON.stringify(parsed, null, 2),
        sensitive: false,
      },
    ];
  }
  return Object.entries(parsed as Record<string, unknown>).map(([key, value]) => {
    const sensitive = isSensitiveKey(key);
    const kind = detectFieldKind(value);
    const isRedacted = sensitive && value === REDACTED_PLACEHOLDER;
    return {
      key,
      kind,
      sensitive,
      value: isRedacted
        ? ""
        : kind === "json"
          ? JSON.stringify(value, null, 2)
          : String(value),
    };
  });
}

/** Chiều ngược lại `parseBodyFields` — build lại body object/JSON để gửi đi. Ném lỗi
 * nếu 1 field kind `json` không parse được (gọi nơi có try/catch validate riêng). */
export function serializeBodyFields(fields: BodyField[]): unknown {
  if (fields.length === 0) return undefined;
  if (fields.length === 1 && fields[0].key === RAW_BODY_FIELD_KEY) {
    return JSON.parse(fields[0].value);
  }
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    switch (field.kind) {
      case "number":
        result[field.key] = Number(field.value);
        break;
      case "boolean":
        result[field.key] = field.value === "true";
        break;
      case "json":
        result[field.key] = JSON.parse(field.value);
        break;
      case "string":
      default:
        result[field.key] = field.value;
    }
  }
  return result;
}

/** Lỗi validate của 1 field, hoặc `null` nếu hợp lệ — field nào cũng bắt buộc có
 * giá trị vì key đó vốn có mặt trong request gốc (endpoint chắc chắn cần nó). */
export function getBodyFieldError(
  field: BodyField,
  messages: { required: string; invalidNumber: string; invalidJson: string },
): string | null {
  if (field.kind === "boolean") return null; // Select luôn có giá trị mặc định
  if (!field.value.trim()) return messages.required;
  if (field.kind === "number" && Number.isNaN(Number(field.value))) {
    return messages.invalidNumber;
  }
  if (field.kind === "json") {
    try {
      JSON.parse(field.value);
    } catch {
      return messages.invalidJson;
    }
  }
  return null;
}
