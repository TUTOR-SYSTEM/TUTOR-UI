import type { Language } from "@/types";

export type TestMonitorDictionary = {
  page: {
    title: string;
    subtitle: (endpoints: number, cases: number) => string;
    environment: (name: string) => string;
    lastRun: string;
    lastRunNever: string;
    lastRunToday: (time: string) => string;
    lastRunOn: (date: string, time: string) => string;
    runAll: (cases: number) => string;
    runAllProgress: (done: number, total: number) => string;
    runAllDone: (passed: number, total: number) => string;
    runAllError: string;
    demoBadge: string;
    demoHint: string;
  };
  filters: {
    title: string;
    serviceLabel: string;
    result: Record<"all" | "err" | "slow" | "ok", string>;
    expandAll: string;
    collapseAll: string;
    searchPlaceholder: string;
    searchLabel: string;
  };
  list: {
    columns: {
      result: string;
      method: string;
      endpoint: string;
      flow: string;
      casesPassed: string;
      calls24h: string;
      p95: string;
      action: string;
    };
    caseCount: (count: number) => string;
    noCases: string;
    expected: string;
    actual: string;
    noResponse: string;
    openTrace: (name: string) => string;
    expandRow: (path: string) => string;
    neverRun: string;
    flow: {
      passes: (services: number) => string;
      stoppedAt: (service: string, status: number | null) => string;
      slowAt: (service: string, duration: string) => string;
    };
    result: Record<"ok" | "err" | "slow", string>;
    categoryBadge: Record<"valid" | "other", string>;
    testButton: string;
    running: string;
    runPassed: (name: string) => string;
    runFailed: (name: string, expected: number, actual: number | null) => string;
    runError: string;
    category: Record<"valid" | "auth" | "validation" | "not_found" | "domain", string>;
    empty: string;
    loading: string;
    error: string;
  };
  usageGuide: {
    steps: { n: number; title: string; body: string }[];
    warning: string;
  };
};

const vi: TestMonitorDictionary = {
  page: {
    title: "Kiểm thử API Gateway",
    subtitle: (endpoints, cases) => `${endpoints} endpoint · ${cases} test case`,
    environment: (name) => `môi trường ${name}`,
    lastRun: "Lần chạy gần nhất:",
    lastRunNever: "Chưa chạy",
    lastRunToday: (time) => `Hôm nay ${time}`,
    lastRunOn: (date, time) => `${date} ${time}`,
    runAll: (cases) => `Test toàn bộ ${cases} case`,
    runAllProgress: (done, total) => `Đang chạy ${done}/${total}...`,
    runAllDone: (passed, total) => `Đã chạy xong: ${passed}/${total} case đạt`,
    runAllError: "Không chạy được toàn bộ kịch bản test.",
    demoBadge: "Dữ liệu demo",
    demoHint: "Đang hiển thị dữ liệu giả lập, không gọi API thật.",
  },
  filters: {
    title: "Danh sách request",
    serviceLabel: "Service",
    result: { all: "Tất cả", err: "Lỗi", slow: "Chậm", ok: "Đạt" },
    expandAll: "Mở tất cả case",
    collapseAll: "Thu gọn tất cả",
    searchPlaceholder: "Tìm endpoint...",
    searchLabel: "Tìm endpoint",
  },
  list: {
    columns: {
      result: "Kết quả",
      method: "Method",
      endpoint: "Endpoint",
      flow: "Luồng service",
      casesPassed: "Case đạt",
      calls24h: "Gọi/24h",
      p95: "P95",
      action: "Thao tác",
    },
    caseCount: (count) => `${count} case`,
    noCases: "Chưa có kịch bản test",
    expected: "kỳ vọng",
    actual: "nhận",
    noResponse: "không có phản hồi",
    openTrace: (name) => `Xem trace của "${name}"`,
    expandRow: (path) => `Mở các case của ${path}`,
    neverRun: "Chưa chạy",
    flow: {
      passes: (services) => `Qua ${services} service`,
      stoppedAt: (service, status) => `Dừng tại ${service} · ${status ?? "không phản hồi"}`,
      slowAt: (service, duration) => `chậm ở ${service} (${duration})`,
    },
    result: { ok: "Đạt", err: "Lỗi", slow: "Chậm" },
    categoryBadge: { valid: "SUCCESS", other: "ERROR" },
    testButton: "Test",
    running: "Đang chạy...",
    runPassed: (name) => `"${name}" đạt`,
    runFailed: (name, expected, actual) =>
      `"${name}" lỗi — mong đợi ${expected}, thực tế ${actual ?? "không có phản hồi"}`,
    runError: "Không chạy được kịch bản test.",
    category: {
      valid: "Hợp lệ",
      auth: "Xác thực",
      validation: "Sai schema",
      not_found: "Không tìm thấy",
      domain: "Nghiệp vụ",
    },
    empty: "Không có endpoint nào phù hợp bộ lọc.",
    loading: "Đang tải kịch bản test...",
    error: "Không tải được danh sách kịch bản test.",
  },
  usageGuide: {
    steps: [
      {
        n: 1,
        title: "Đọc bảng theo endpoint",
        body: "Mỗi dòng là 1 endpoint kèm số case đạt, số lần gọi và P95 trong 24h gần nhất (lấy từ request_logs). Bấm vào dòng để mở các case con, bấm vào một case để xem trace lần chạy gần nhất.",
      },
      {
        n: 2,
        title: "Chạy 1 case",
        body: "Bấm nút Test trên case để bắn request thật tới gateway. Request đi qua toàn bộ hệ thống nên cũng xuất hiện ở trang Nhật ký request với correlationId riêng.",
      },
      {
        n: 3,
        title: "Lọc nhanh",
        body: "Chip service lọc theo service phụ trách; chip kết quả: Lỗi = có case lần chạy gần nhất không đạt, Chậm = P95 vượt ngưỡng, Đạt = còn lại.",
      },
    ],
    warning:
      "Test chạy trên dữ liệu thật của môi trường hiện tại — các case ghi (POST/PUT/DELETE) có thể thay đổi dữ liệu.",
  },
};

const en: TestMonitorDictionary = {
  page: {
    title: "API Gateway testing",
    subtitle: (endpoints, cases) =>
      `${endpoints} ${endpoints === 1 ? "endpoint" : "endpoints"} · ${cases} test ${cases === 1 ? "case" : "cases"}`,
    environment: (name) => `${name} environment`,
    lastRun: "Last run:",
    lastRunNever: "Never run",
    lastRunToday: (time) => `Today ${time}`,
    lastRunOn: (date, time) => `${date} ${time}`,
    runAll: (cases) => `Test all ${cases} ${cases === 1 ? "case" : "cases"}`,
    runAllProgress: (done, total) => `Running ${done}/${total}...`,
    runAllDone: (passed, total) => `Finished: ${passed}/${total} cases passed`,
    runAllError: "Could not run all test scenarios.",
    demoBadge: "Demo data",
    demoHint: "Showing simulated data; no real API calls are made.",
  },
  filters: {
    title: "Request list",
    serviceLabel: "Service",
    result: { all: "All", err: "Failed", slow: "Slow", ok: "Passing" },
    expandAll: "Expand all cases",
    collapseAll: "Collapse all",
    searchPlaceholder: "Search endpoint...",
    searchLabel: "Search endpoint",
  },
  list: {
    columns: {
      result: "Result",
      method: "Method",
      endpoint: "Endpoint",
      flow: "Service flow",
      casesPassed: "Cases passed",
      calls24h: "Calls/24h",
      p95: "P95",
      action: "Action",
    },
    caseCount: (count) => `${count} ${count === 1 ? "case" : "cases"}`,
    noCases: "No test scenarios yet",
    expected: "expected",
    actual: "got",
    noResponse: "no response",
    openTrace: (name) => `View trace of "${name}"`,
    expandRow: (path) => `Expand cases of ${path}`,
    neverRun: "Never run",
    flow: {
      passes: (services) => `Through ${services} ${services === 1 ? "service" : "services"}`,
      stoppedAt: (service, status) => `Stopped at ${service} · ${status ?? "no response"}`,
      slowAt: (service, duration) => `slow at ${service} (${duration})`,
    },
    result: { ok: "Pass", err: "Fail", slow: "Slow" },
    categoryBadge: { valid: "SUCCESS", other: "ERROR" },
    testButton: "Test",
    running: "Running...",
    runPassed: (name) => `"${name}" passed`,
    runFailed: (name, expected, actual) =>
      `"${name}" failed — expected ${expected}, got ${actual ?? "no response"}`,
    runError: "Could not run the test scenario.",
    category: {
      valid: "Valid",
      auth: "Auth",
      validation: "Validation",
      not_found: "Not found",
      domain: "Domain",
    },
    empty: "No endpoints match the filters.",
    loading: "Loading test scenarios...",
    error: "Could not load test scenarios.",
  },
  usageGuide: {
    steps: [
      {
        n: 1,
        title: "Read the table by endpoint",
        body: "Each row is one endpoint with its cases passed, call count and P95 over the last 24h (from request_logs). Click a row to expand its cases, then a case to see the trace of its latest run.",
      },
      {
        n: 2,
        title: "Run a case",
        body: "Press Test on a case to fire a real request at the gateway. It goes through the whole system, so it also shows up on the request logs page under its own correlationId.",
      },
      {
        n: 3,
        title: "Filter quickly",
        body: "Service chips filter by owning service; result chips: Failed = a case's latest run failed, Slow = P95 over the threshold, Passing = everything else.",
      },
    ],
    warning:
      "Tests run against the live data of the current environment — write cases (POST/PUT/DELETE) may change data.",
  },
};

export const testMonitorDictionary: Record<Language, TestMonitorDictionary> = { vi, en };
