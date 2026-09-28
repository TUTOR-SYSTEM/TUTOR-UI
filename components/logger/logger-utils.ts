import type {
  ApiRequestLog,
  LoggerRequestFilter,
  LoggerServiceKey,
  LoggerTraceNode,
} from "@/types";

// ─── Services & colors (real `serviceName` values — see API_ENDPOINTS.md #22) ──────────────

export const SERVICES: Record<LoggerServiceKey, { name: string; color: string }> = {
  gateway: { name: "API Gateway", color: "#0E9F8E" },
  "tutor-service": { name: "Tutor Service", color: "#2563EB" },
  "third-service": { name: "Third Service", color: "#7C3AED" },
  "user-service": { name: "User Service", color: "#D97706" },
};

export function serviceNameOf(key: string): string {
  return SERVICES[key as LoggerServiceKey]?.name ?? key;
}

export function serviceColorOf(key: string): string {
  return SERVICES[key as LoggerServiceKey]?.color ?? "#5C726D";
}

export const METHOD_COLOR: Record<string, { bg: string; text: string }> = {
  GET: { bg: "#DBEAFE", text: "#2563EB" },
  POST: { bg: "#E4F6EF", text: "#0B7A6D" },
  PUT: { bg: "#FFE8D6", text: "#C2410C" },
  PATCH: { bg: "#FEF3C7", text: "#B45309" },
  DELETE: { bg: "#FEE9E4", text: "#C2412B" },
};

export function methodColorOf(method: string | null): { bg: string; text: string } {
  return (method && METHOD_COLOR[method]) || { bg: "#EEF2F1", text: "#5C726D" };
}

/** Bảng màu trạng thái dùng chung (badge kết quả, waterfall bar...). */
export const STATUS_TONE_STYLE: Record<"ok" | "warn" | "err", { bg: string; text: string }> = {
  ok: { bg: "#E4F6EF", text: "#0B7A6D" },
  warn: { bg: "#FEF3C7", text: "#B45309" },
  err: { bg: "#FEE9E4", text: "#C2412B" },
};

const HTTP_STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  422: "Unprocessable Entity",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

export function httpStatusText(status: number | null): string {
  if (status === null) return "";
  return HTTP_STATUS_TEXT[status] ?? "";
}

export function httpStatusTone(status: number | null): "ok" | "warn" | "err" {
  if (status === null) return "err";
  if (status >= 500) return "err";
  if (status >= 400) return "warn";
  return "ok";
}

export const SLOW_DURATION_MS = 400;
export const VERY_SLOW_DURATION_MS = 1000;

export function durationTone(ms: number): "err" | "warn" | null {
  if (ms >= VERY_SLOW_DURATION_MS) return "err";
  if (ms >= SLOW_DURATION_MS) return "warn";
  return null;
}

/** Điều kiện `cat(q)` — chip lọc danh sách request (áp dụng cho hàng gốc, luôn có `statusCode`
 * thật vì là hop HTTP tại gateway). */
export function categoryOf(row: ApiRequestLog): Exclude<LoggerRequestFilter, "all"> {
  const status = row.statusCode ?? 0;
  if (status >= 500) return "err";
  if (status >= 400) return "warn";
  if (row.durationMs >= SLOW_DURATION_MS) return "slow";
  return "ok";
}

export function matchesFilter(row: ApiRequestLog, filter: LoggerRequestFilter): boolean {
  return filter === "all" || categoryOf(row) === filter;
}

export function formatDuration(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** `createdAt` (ISO, UTC) → `{ date: "DD/MM/YYYY", time: "HH:mm:ss" }` giờ local trình duyệt. */
export function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`,
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`,
  };
}

export function formatBytes(text: string | null | undefined): string {
  if (!text) return "0 B";
  const bytes = new TextEncoder().encode(text).length;
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

/** Trạng thái 1 hàng trong trace (dùng cho màu bar waterfall + badge span) — dựa trên
 * `errorMessage`/`statusCode` thật, không có khái niệm "skip" (mock cũ) vì dữ liệu thật không mô
 * phỏng nhánh lỗi lan truyền — nếu 1 hop cha lỗi, các hop con thật đơn giản là không tồn tại. */
export function nodeStatusTone(row: ApiRequestLog): "ok" | "warn" | "err" {
  if (row.errorMessage) return "err";
  if (row.statusCode !== null) {
    if (row.statusCode >= 500) return "err";
    if (row.statusCode >= 400) return "warn";
  }
  return "ok";
}

function startOfMs(row: ApiRequestLog): number {
  return new Date(row.createdAt).getTime() - row.durationMs;
}

/** Dựng cây trace từ danh sách phẳng `GET /logs/trace/:correlationId` (mỗi hàng tự có `traceId`,
 * trỏ về hop gọi mình qua `parentTraceId`) — trả về thứ tự duyệt trước (cha trước, con theo sau,
 * cùng cấp sắp theo thời gian), kèm `depth` (số cấp cha) và `startMs` (mốc bắt đầu tương đối so
 * với hàng gốc, suy ra từ `createdAt - durationMs` vì BE chỉ ghi thời điểm HOÀN TẤT). */
export function buildTraceTree(rows: ApiRequestLog[]): LoggerTraceNode[] {
  if (rows.length === 0) return [];

  const byTraceId = new Map(rows.map((r) => [r.traceId, r]));
  const childrenOf = new Map<string, ApiRequestLog[]>();
  const roots: ApiRequestLog[] = [];

  for (const row of rows) {
    if (row.parentTraceId && byTraceId.has(row.parentTraceId)) {
      const siblings = childrenOf.get(row.parentTraceId) ?? [];
      siblings.push(row);
      childrenOf.set(row.parentTraceId, siblings);
    } else {
      roots.push(row);
    }
  }

  const byCreatedAt = (a: ApiRequestLog, b: ApiRequestLog) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  roots.sort(byCreatedAt);
  for (const siblings of childrenOf.values()) siblings.sort(byCreatedAt);

  const rootStartMs = startOfMs(roots[0]);
  const result: LoggerTraceNode[] = [];

  function visit(row: ApiRequestLog, depth: number) {
    result.push({ ...row, depth, startMs: Math.max(0, startOfMs(row) - rootStartMs) });
    for (const child of childrenOf.get(row.traceId) ?? []) visit(child, depth + 1);
  }

  for (const root of roots) visit(root, 0);
  return result;
}

export function distinctServicesCount(nodes: LoggerTraceNode[]): number {
  return new Set(nodes.map((n) => n.serviceName)).size;
}

export function errorNodeCount(nodes: LoggerTraceNode[]): number {
  return nodes.filter((n) => nodeStatusTone(n) === "err").length;
}

/** Nhãn "gọi bởi" cho 1 node trong cây — node gốc (không có cha) luôn là client thật gọi vào
 * gateway; các node còn lại lấy tên service của node cha (`parentIdx`, tính bằng cách tìm ngược
 * trong mảng đã duyệt trước — mảng đã ở thứ tự duyệt trước nên cha luôn đứng trước con). */
export function parentIndexOf(nodes: LoggerTraceNode[], index: number): number | null {
  const parentTraceId = nodes[index].parentTraceId;
  if (!parentTraceId) return null;
  for (let i = index - 1; i >= 0; i--) {
    if (nodes[i].traceId === parentTraceId) return i;
  }
  return null;
}

export function directChildIndexes(nodes: LoggerTraceNode[], index: number): number[] {
  const traceId = nodes[index].traceId;
  const result: number[] = [];
  nodes.forEach((n, i) => {
    if (n.parentTraceId === traceId) result.push(i);
  });
  return result;
}
