import type { LoggerDictionary } from "@/lib/i18n/logger.dictionary";
import type {
  ApiRequestLog,
  ApiTestScenario,
  LoggerRequestFilter,
  LoggerServiceKey,
  LoggerTraceNode,
  PlaybackEvent,
  PlaybackLine,
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

/** Body log dạng JSON → in thụt lề cho dễ đọc; không phải JSON (hoặc bị cắt `…(truncated)`) thì
 * giữ nguyên. */
export function prettyBody(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
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

/** Đơn vị hiển thị của pipeline ngang: mỗi service đi qua đúng 1 ô (theo thứ tự xuất hiện đầu
 * tiên), `tone` là mức xấu nhất trong mọi hop của service đó. */
export function pipelineHops(
  nodes: LoggerTraceNode[],
): { service: string; tone: "ok" | "warn" | "err"; durationMs: number }[] {
  const rank = { ok: 0, warn: 1, err: 2 } as const;
  const hops = new Map<string, { service: string; tone: "ok" | "warn" | "err"; durationMs: number }>();
  for (const node of nodes) {
    const tone = nodeStatusTone(node);
    const hop = hops.get(node.serviceName);
    if (!hop) {
      hops.set(node.serviceName, { service: node.serviceName, tone, durationMs: node.durationMs });
    } else {
      if (rank[tone] > rank[hop.tone]) hop.tone = tone;
      hop.durationMs = Math.max(hop.durationMs, node.durationMs);
    }
  }
  return [...hops.values()];
}

const shellQuote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;

/** Dựng lệnh cURL từ hop gốc. `request_logs` không lưu header nên chỉ dựng được `Content-Type`
 * (khi có body) và một placeholder `Authorization` để người dùng tự điền token. */
export function buildCurl(
  node: Pick<ApiRequestLog, "method" | "path" | "requestBody">,
  baseUrl: string,
): string {
  const method = node.method ?? "GET";
  const parts = [`curl -X ${method} ${shellQuote(`${baseUrl.replace(/\/$/, "")}${node.path}`)}`];
  parts.push(`-H ${shellQuote("Authorization: Bearer <ACCESS_TOKEN>")}`);
  if (node.requestBody) {
    parts.push(`-H ${shellQuote("Content-Type: application/json")}`);
    parts.push(`--data-raw ${shellQuote(node.requestBody)}`);
  }
  return parts.join(" \\\n  ");
}

/** Chọn kịch bản để "Chạy realtime" cho request đang xem: cùng `method + path` (bỏ query);
 * ưu tiên kịch bản đã sinh ra chính request này, rồi case `valid`, rồi case đầu tiên. */
export function pickScenarioFor(
  scenarios: ApiTestScenario[],
  request: Pick<ApiRequestLog, "method" | "path" | "correlationId">,
): ApiTestScenario | null {
  const segmentsOf = (p: string) => p.split("?")[0].split("/").filter(Boolean);
  // A path parameter in a scenario template (":id" / "{id}") or an id-like segment in a real
  // request (UUID / number) matches any single segment, so "/students/9f2…" hits "/students/:id".
  const isParam = (seg: string) => /^(:|\{)/.test(seg);
  const isIdLike = (seg: string) =>
    /^\d+$/.test(seg) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg);
  const samePath = (scenarioPath: string, requestPath: string) => {
    const a = segmentsOf(scenarioPath);
    const b = segmentsOf(requestPath);
    // Compare from the end so a global prefix on one side only ("/api/students" vs "/students")
    // doesn't break the match.
    const n = Math.min(a.length, b.length);
    if (n === 0) return false;
    const tailA = a.slice(a.length - n);
    const tailB = b.slice(b.length - n);
    return tailA.every((seg, i) => seg === tailB[i] || isParam(seg) || (isIdLike(seg) && isIdLike(tailB[i])));
  };
  const method = request.method?.toUpperCase();
  const matches = scenarios.filter(
    (s) => s.method.toUpperCase() === method && samePath(s.path, request.path),
  );
  return (
    matches.find((s) => s.lastRun?.correlationId === request.correlationId) ??
    matches.find((s) => s.category === "valid") ??
    matches[0] ??
    null
  );
}

// ─── Playback (replay của 1 lần "Chạy realtime") ─────────────────────────────

/** Khoá đại diện ô CLIENT trong `frontier`/`progress` của pipeline. */
export const CLIENT_KEY = "__client__";

/** Chuỗi sự kiện của cây trace (`nodes` đã ở thứ tự duyệt trước): request vào hop cha rồi mới vào
 * con, kết quả trả ngược từ con về cha, root cuối cùng trả về client. Hop có lỗi thêm 1 sự kiện
 * `error` ngay sau khi vào; ở hop lỗi đầu tiên, các service của đường đi cũ (`expectedServices`) mà
 * lần chạy này không chạm tới được đánh dấu `skip`. */
export function buildPlaybackEvents(
  nodes: LoggerTraceNode[],
  expectedServices: string[] = [],
): PlaybackEvent[] {
  const events: PlaybackEvent[] = [];
  const stack: number[] = [];
  const reached = new Set(nodes.map((n) => n.serviceName));
  let skipped = false;
  nodes.forEach((node, index) => {
    while (stack.length > 0 && nodes[stack[stack.length - 1]].depth >= node.depth) {
      events.push({ kind: "exit", index: stack.pop()! });
    }
    events.push({ kind: "enter", index });
    stack.push(index);
    if (node.errorMessage) {
      events.push({ kind: "error", index });
      if (!skipped) {
        skipped = true;
        for (const service of expectedServices) {
          if (!reached.has(service)) events.push({ kind: "skip", index: -1, service });
        }
      }
    }
  });
  while (stack.length > 0) events.push({ kind: "exit", index: stack.pop()! });
  return events;
}

/** Trạng thái sau khi đã áp `applied` sự kiện đầu: hop đang "cầm" request (`current`), các hop đã
 * được request chạm tới (`entered`), service bị bỏ qua (`skipped`) và request đang đi hay trả về. */
export function playbackFrontier(
  nodes: LoggerTraceNode[],
  events: PlaybackEvent[],
  applied: number,
): {
  current: number | null;
  entered: Set<number>;
  skipped: string[];
  direction: "going" | "returning";
} {
  const entered = new Set<number>();
  const skipped: string[] = [];
  let current: number | null = null;
  let direction: "going" | "returning" = "going";
  for (const event of events.slice(0, applied)) {
    if (event.kind === "enter") {
      entered.add(event.index);
      current = event.index;
      direction = "going";
    } else if (event.kind === "exit") {
      current = parentIndexOf(nodes, event.index);
      direction = "returning";
    } else if (event.kind === "skip") {
      skipped.push(event.service);
    }
  }
  return { current, entered, skipped, direction };
}

/** Mã lỗi ngắn của 1 hop lỗi: phần trước " — " của `errorMessage` (vd `4 DEADLINE_EXCEEDED`). */
export function errorCodeOf(node: Pick<ApiRequestLog, "errorMessage">): string | null {
  if (!node.errorMessage) return null;
  return node.errorMessage.split(" — ")[0].trim();
}

/** Nhóm nguyên nhân để chọn gợi ý xử lý cho hop lỗi. */
export function errorKindOf(
  node: Pick<ApiRequestLog, "errorMessage" | "statusCode">,
): "timeout" | "unavailable" | "server" | "client" | null {
  const message = node.errorMessage ?? "";
  if (/DEADLINE_EXCEEDED|timeout|timed out/i.test(message)) return "timeout";
  if (/UNAVAILABLE|ECONNREFUSED|ENOTFOUND/i.test(message)) return "unavailable";
  if ((node.statusCode ?? 0) >= 500 || (message && node.statusCode === null)) return "server";
  if ((node.statusCode ?? 0) >= 400) return "client";
  return null;
}

function statusLabelOf(node: ApiRequestLog): string {
  const code = errorCodeOf(node);
  if (code) return code;
  if (node.statusCode !== null) return String(node.statusCode);
  return nodeStatusTone(node) === "ok" ? "OK" : "ERR";
}

/** Toàn bộ dòng LIVE TRACE của 1 lần chạy, theo đúng thứ tự phát: [gửi, ...sự kiện, kết quả] —
 * đúng 1 dòng cho mỗi sự kiện nên số dòng hiện ra khớp bước phát lại. */
export function buildPlaybackLines({
  nodes,
  events,
  scenario,
  correlationId,
  actualStatus,
  copy,
}: {
  nodes: LoggerTraceNode[];
  events: PlaybackEvent[];
  scenario: ApiTestScenario;
  correlationId: string;
  actualStatus: number | null;
  copy: LoggerDictionary["detail"]["live"];
}): PlaybackLine[] {
  const lines: PlaybackLine[] = [
    {
      key: "sent",
      text: `▶ ${copy.sent(scenario.method, scenario.path, scenario.name, correlationId)}`,
      tone: "plain",
      services: [],
    },
  ];

  events.forEach((event, i) => {
    const key = `${event.kind}-${i}`;
    if (event.kind === "skip") {
      lines.push({ key, text: `○ ${copy.skipped(serviceNameOf(event.service))}`, tone: "muted", services: [] });
      return;
    }
    const node = nodes[event.index];
    const tone = nodeStatusTone(node);
    if (event.kind === "enter") {
      const operation = node.type === "HTTP" ? `${node.method ?? ""} ${node.path}`.trim() : node.path;
      lines.push({
        key,
        text: `→ ${serviceNameOf(node.serviceName)} · ${node.type} ${operation}`,
        tone: "plain",
        services: [node.serviceName],
      });
      return;
    }
    if (event.kind === "error") {
      lines.push({
        key,
        text: `✕ ${copy.error(serviceNameOf(node.serviceName), node.errorMessage ?? "")}`,
        tone: "err",
        services: [node.serviceName],
      });
      return;
    }
    const parentIdx = parentIndexOf(nodes, event.index);
    if (parentIdx === null) {
      lines.push({
        key,
        text: copy.received(node.statusCode, httpStatusText(node.statusCode), formatDuration(node.durationMs)),
        tone: tone === "ok" ? "plain" : tone,
        services: [node.serviceName],
      });
      return;
    }
    lines.push({
      key,
      text: `← ${serviceNameOf(node.serviceName)} → ${serviceNameOf(nodes[parentIdx].serviceName)} · ${statusLabelOf(node)} · ${formatDuration(node.durationMs)}`,
      tone,
      services: [node.serviceName, nodes[parentIdx].serviceName],
    });
  });

  const pass = actualStatus === scenario.expectedStatus;
  lines.push({
    key: "result",
    text: `● ${copy.result}: ${
      pass
        ? copy.resultPass(scenario.expectedStatus, actualStatus)
        : copy.resultFail(scenario.expectedStatus, actualStatus)
    }`,
    tone: pass ? "pass" : "fail",
    services: [],
  });
  return lines;
}

/** `requestHeaders`/`responseHeaders` (JSON-string map) → các cặp `[tên, giá trị]` đã sắp theo tên.
 * `null` khi rỗng, không phải JSON object hoặc parse lỗi — UI ẩn bảng header trong các trường hợp đó. */
export function parseHeaders(raw: string | null | undefined): [string, string][] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const entries = Object.entries(parsed as Record<string, unknown>).map(
      ([k, v]): [string, string] => [k, typeof v === "string" ? v : JSON.stringify(v)],
    );
    return entries.length > 0 ? entries.sort(([a], [b]) => a.localeCompare(b)) : null;
  } catch {
    return null;
  }
}
