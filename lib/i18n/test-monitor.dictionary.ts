import type { Language } from "@/types";

export type TestMonitorDictionary = {
  page: { title: string; subtitle: string };
  filters: {
    serviceAll: string;
    result: Record<"all" | "err" | "slow" | "ok", string>;
  };
  list: {
    title: (endpoints: number) => string;
    columns: {
      endpoint: string;
      casesPassed: string;
      calls24h: string;
      p95: string;
      action: string;
    };
    caseCount: (count: number) => string;
    noCases: string;
    expectedStatus: (status: number) => string;
    actualStatus: (status: number | null) => string;
    neverRun: string;
    passBadge: string;
    failBadge: string;
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
    title: "Kiểm thử endpoint",
    subtitle: "Kịch bản test theo từng endpoint · số case đạt · lưu lượng & P95 trong 24h",
  },
  filters: {
    serviceAll: "Tất cả service",
    result: { all: "Tất cả", err: "Lỗi", slow: "Chậm", ok: "Đạt" },
  },
  list: {
    title: (endpoints) => `Endpoint · ${endpoints} kết quả`,
    columns: {
      endpoint: "Endpoint",
      casesPassed: "Case đạt",
      calls24h: "Gọi/24h",
      p95: "P95",
      action: "Thao tác",
    },
    caseCount: (count) => `${count} case`,
    noCases: "Chưa có kịch bản test",
    expectedStatus: (status) => `Mong đợi ${status}`,
    actualStatus: (status) => (status === null ? "Không có phản hồi" : `Thực tế ${status}`),
    neverRun: "Chưa chạy",
    passBadge: "Đạt",
    failBadge: "Lỗi",
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
        body: "Mỗi dòng là 1 endpoint kèm số case đạt, số lần gọi và P95 trong 24h gần nhất (lấy từ request_logs). Bấm vào dòng để mở các case con.",
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
    title: "Endpoint testing",
    subtitle: "Test scenarios per endpoint · cases passed · 24h traffic & P95",
  },
  filters: {
    serviceAll: "All services",
    result: { all: "All", err: "Failed", slow: "Slow", ok: "Passing" },
  },
  list: {
    title: (endpoints) => `Endpoints · ${endpoints} results`,
    columns: {
      endpoint: "Endpoint",
      casesPassed: "Cases passed",
      calls24h: "Calls/24h",
      p95: "P95",
      action: "Action",
    },
    caseCount: (count) => `${count} ${count === 1 ? "case" : "cases"}`,
    noCases: "No test scenarios yet",
    expectedStatus: (status) => `Expected ${status}`,
    actualStatus: (status) => (status === null ? "No response" : `Actual ${status}`),
    neverRun: "Never run",
    passBadge: "Pass",
    failBadge: "Fail",
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
        body: "Each row is one endpoint with its cases passed, call count and P95 over the last 24h (from request_logs). Click a row to expand its cases.",
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
