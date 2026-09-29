import type { Language } from "@/types";

export type LoggerDictionary = {
  page: {
    title: string;
    subtitle: string;
  };
  list: {
    title: (count: number) => string;
    searchPlaceholder: string;
    filters: Record<"all" | "err" | "warn" | "slow" | "ok", string>;
    columns: {
      result: string;
      method: string;
      endpoint: string;
      duration: string;
    };
    resultBadge: Record<"ok" | "warn" | "err" | "slow", string>;
    subline: (dateTime: string, ip: string) => string;
    empty: string;
    loading: string;
    error: string;
  };
  stats: {
    title: string;
    columns: {
      method: string;
      endpoint: string;
      calls24h: string;
      errors24h: string;
      p95: string;
    };
    empty: string;
    loading: string;
    error: string;
  };
  detail: {
    headerTitle: string;
    headerPosition: (index: number, total: number) => string;
    escHint: string;
    expected: (status: number) => string;
    prev: string;
    next: string;
    close: string;
    traceIdLabel: string;
    copyTraceId: string;
    traceIdCopied: string;
    loadingTrace: string;
    summary: {
      totalTime: string;
      servicesPassedLabel: string;
      servicesPassed: (count: number) => string;
      spanCountLabel: string;
      spanCount: (total: number, errorCount: number) => string;
      clientIp: string;
    };
    errorBox: (service: string) => string;
    pipeline: { title: string; client: string; clientHint: string; waiting: string; processing: string; skipped: string };
    live: {
      title: string;
      waiting: string;
      streaming: string;
      done: string;
      stop: string;
      hops: (count: number) => string;
      tracking: (service: string) => string;
      clearTracking: string;
      clickToTrack: string;
      idle: string;
      idleHint: string;
      sent: (method: string, path: string, caseName: string, trace: string) => string;
      received: (status: number | null, statusText: string, total: string) => string;
      error: (service: string, message: string) => string;
      skipped: (service: string) => string;
      result: string;
      resultPass: (expected: number, actual: number | null) => string;
      resultFail: (expected: number, actual: number | null) => string;
      status: {
        last: string;
        sending: string;
        toService: (service: string) => string;
        returning: string;
      };
    };
    actions: {
      copyCurl: string;
      curlCopied: string;
      runRealtime: string;
      rerunRealtime: string;
      runRealtimeNoScenario: string;
      runRealtimeError: string;
    };
    verdict: {
      pass: string;
      fail: (expected: number, actual: number | null) => string;
      pending: string;
    };
    waterfall: { title: string; timeStart: string; timeEnd: (totalMs: number) => string };
    span: {
      noBody: string;
      calledFrom: string;
      via: string;
      processingHint: (service: string) => string;
      errorTitle: string;
      hintTitle: string;
      hints: {
        timeout: (service: string, operation: string) => string;
        unavailable: (service: string) => string;
        server: (service: string) => string;
        client: (service: string) => string;
      };
      tabs: { req: string; res: string; processing: string };
      callFlow: { client: string };
      requestTab: { body: string };
      responseTab: { responseTime: string; size: string; body: string };
      processingTab: {
        metrics: { start: string; duration: string; percentOfTrace: string };
        childrenTitle: string;
        noChildren: string;
      };
    };
  };
  usageGuide: {
    steps: { n: number; title: string; body: string }[];
    warning: string;
  };
};

const vi: LoggerDictionary = {
  page: {
    title: "Giám sát Request",
    subtitle: "Theo dõi request qua từng microservice · distributed tracing · realtime",
  },
  list: {
    title: (count) => `Danh sách request · ${count} kết quả`,
    searchPlaceholder: "Tìm endpoint...",
    filters: {
      all: "Tất cả",
      err: "Lỗi 5xx",
      warn: "Lỗi 4xx",
      slow: "Chậm",
      ok: "Thành công",
    },
    columns: {
      result: "Kết quả",
      method: "Method",
      endpoint: "Endpoint",
      duration: "Thời gian xử lý",
    },
    resultBadge: { ok: "Đạt", warn: "Lỗi", err: "Lỗi", slow: "Chậm" },
    subline: (dateTime, ip) => `${dateTime} · ${ip}`,
    empty: "Không có request nào phù hợp bộ lọc.",
    loading: "Đang tải request...",
    error: "Không tải được danh sách request.",
  },
  stats: {
    title: "Thống kê endpoint · 24h gần nhất",
    columns: {
      method: "Method",
      endpoint: "Endpoint",
      calls24h: "Gọi/24h",
      errors24h: "Lỗi/24h",
      p95: "P95",
    },
    empty: "Chưa có request nào trong 24h gần nhất.",
    loading: "Đang tải thống kê...",
    error: "Không tải được thống kê endpoint.",
  },
  detail: {
    headerTitle: "Chi tiết request",
    headerPosition: (index, total) => `Request ${index} / ${total}`,
    escHint: "Esc để đóng",
    expected: (status) => `kỳ vọng ${status}`,
    prev: "Trước",
    next: "Sau",
    close: "Đóng",
    traceIdLabel: "Correlation ID",
    copyTraceId: "Sao chép Correlation ID",
    traceIdCopied: "Đã sao chép Correlation ID",
    loadingTrace: "Đang tải luồng qua các service...",
    summary: {
      totalTime: "Tổng thời gian",
      servicesPassedLabel: "Service đi qua",
      servicesPassed: (count) => `${count} service`,
      spanCountLabel: "Hop / lỗi",
      spanCount: (total, errorCount) => `${total} hop · ${errorCount} lỗi`,
      clientIp: "Client IP",
    },
    errorBox: (service) => `Lỗi phát sinh tại ${service}`,
    pipeline: { title: "Luồng request qua từng service", client: "CLIENT", clientHint: "Web / App", waiting: "Chờ", processing: "Đang xử lý", skipped: "Bỏ qua" },
    live: {
      title: "LIVE TRACE",
      waiting: "Đang chờ hop đầu tiên...",
      streaming: "Đang nhận realtime",
      done: "Hoàn tất",
      stop: "Dừng theo dõi",
      hops: (count) => `${count} hop`,
      tracking: (service) => `Đang theo dõi realtime: ${service}`,
      clearTracking: "Xem tất cả",
      clickToTrack: "bấm để xem chi tiết · theo dõi realtime riêng service đó",
      idle: "chờ chạy",
      idleHint: "Bấm “Chạy realtime” để xem request đi qua từng service.",
      sent: (method, path, caseName, trace) => `Client gửi ${method} ${path} · case “${caseName}” · trace ${trace}`,
      received: (status, statusText, total) => `Client nhận ${status ?? "—"} ${statusText} · tổng ${total}`.replace("  ", " "),
      error: (service, message) => `${service} lỗi · ${message}`,
      skipped: (service) => `${service} · bỏ qua`,
      result: "Kết quả",
      resultPass: (expected, actual) => `Đạt · kỳ vọng ${expected}, nhận ${actual ?? "—"}`,
      resultFail: (expected, actual) => `Lỗi · kỳ vọng ${expected}, nhận ${actual ?? "—"}`,
      status: {
        last: "lần chạy gần nhất",
        sending: "đang gửi request...",
        toService: (service) => `request đang đi tới ${service}`,
        returning: "response đang trả về",
      },
    },
    actions: {
      copyCurl: "Sao chép cURL",
      curlCopied: "Đã sao chép lệnh cURL (thay <ACCESS_TOKEN> bằng token thật)",
      runRealtime: "Chạy realtime",
      rerunRealtime: "Chạy lại",
      runRealtimeNoScenario: "Chưa có kịch bản test cho endpoint này",
      runRealtimeError: "Không chạy được kịch bản test.",
    },
    verdict: {
      pass: "Đạt",
      fail: (expected, actual) => `Lỗi — mong đợi ${expected}, thực tế ${actual ?? "không có phản hồi"}`,
      pending: "Đang chạy...",
    },
    waterfall: {
      title: "Luồng qua microservice",
      timeStart: "0ms",
      timeEnd: (totalMs) => `${totalMs}ms`,
    },
    span: {
      noBody: "(không có body)",
      calledFrom: "gọi từ",
      via: "qua",
      processingHint: (service) => `${service} đang xử lý...`,
      errorTitle: "Lỗi tại service này:",
      hintTitle: "Gợi ý xử lý:",
      hints: {
        timeout: (service, operation) =>
          `${service} phản hồi chậm khi gọi ${operation}. Kiểm tra truy vấn/index chậm, số replica và tăng timeout hoặc thêm cache.`,
        unavailable: (service) =>
          `${service} không kết nối được. Kiểm tra service có đang chạy, địa chỉ/port và mạng giữa các container.`,
        server: (service) => `${service} gặp lỗi nội bộ. Xem log chi tiết của service này theo trace ID.`,
        client: (service) => `${service} từ chối request. Kiểm tra payload, token và quyền của người gọi.`,
      },
      tabs: { req: "Request", res: "Response", processing: "Xử lý" },
      callFlow: { client: "Client (Web / App)" },
      requestTab: { body: "Body" },
      responseTab: { responseTime: "Thời gian phản hồi", size: "Kích thước", body: "Body" },
      processingTab: {
        metrics: { start: "Bắt đầu", duration: "Thời lượng", percentOfTrace: "% trace" },
        childrenTitle: "Hop con",
        noChildren: "Hop này không gọi tiếp service nào khác.",
      },
    },
  },
  usageGuide: {
    steps: [
      {
        n: 1,
        title: "Lọc theo trạng thái",
        body: "Dùng chip \"Lỗi 5xx\" / \"Lỗi 4xx\" / \"Chậm\" / \"Thành công\" để thu hẹp danh sách, hoặc gõ vào ô tìm kiếm để lọc theo endpoint. Request mới phát sinh tự hiện lên đầu danh sách theo thời gian thực, không cần tải lại trang.",
      },
      {
        n: 2,
        title: "Xem chi tiết luồng qua từng service",
        body: "Bấm 1 dòng để mở popup — waterfall hiển thị toàn bộ hop xuyên các microservice (dựng từ dữ liệu thật ghi ở bảng request_logs), bấm 1 hop để xem body request/response thật ở 2 cột Request/Response, cùng thời điểm/tỷ lệ thời gian ở mục Xử lý. Dùng nút Trước/Sau để chuyển sang request khác trong danh sách đang lọc.",
      },
    ],
    warning:
      "Danh sách chỉ hiển thị request HTTP đi vào qua API Gateway — các lệnh RPC nội bộ giữa các service chỉ xuất hiện trong luồng waterfall của request cha, không phải dòng riêng ở danh sách.",
  },
};

const en: LoggerDictionary = {
  page: {
    title: "Request Monitoring",
    subtitle: "Track requests across microservices · distributed tracing · realtime",
  },
  list: {
    title: (count) => `Request list · ${count} results`,
    searchPlaceholder: "Search endpoint...",
    filters: {
      all: "All",
      err: "5xx errors",
      warn: "4xx errors",
      slow: "Slow",
      ok: "Successful",
    },
    columns: {
      result: "Result",
      method: "Method",
      endpoint: "Endpoint",
      duration: "Duration",
    },
    resultBadge: { ok: "Passed", warn: "Failed", err: "Failed", slow: "Slow" },
    subline: (dateTime, ip) => `${dateTime} · ${ip}`,
    empty: "No request matches the current filter.",
    loading: "Loading requests...",
    error: "Failed to load the request list.",
  },
  stats: {
    title: "Endpoint stats · last 24h",
    columns: {
      method: "Method",
      endpoint: "Endpoint",
      calls24h: "Calls/24h",
      errors24h: "Errors/24h",
      p95: "P95",
    },
    empty: "No requests in the last 24h yet.",
    loading: "Loading stats...",
    error: "Failed to load endpoint stats.",
  },
  detail: {
    headerTitle: "Request detail",
    headerPosition: (index, total) => `Request ${index} / ${total}`,
    escHint: "Esc to close",
    expected: (status) => `expected ${status}`,
    prev: "Previous",
    next: "Next",
    close: "Close",
    traceIdLabel: "Correlation ID",
    copyTraceId: "Copy Correlation ID",
    traceIdCopied: "Correlation ID copied",
    loadingTrace: "Loading the flow across services...",
    summary: {
      totalTime: "Total time",
      servicesPassedLabel: "Services passed",
      servicesPassed: (count) => `${count} services`,
      spanCountLabel: "Hops / errors",
      spanCount: (total, errorCount) => `${total} hops · ${errorCount} errors`,
      clientIp: "Client IP",
    },
    errorBox: (service) => `Error originated at ${service}`,
    pipeline: { title: "Request flow across services", client: "CLIENT", clientHint: "Web / App", waiting: "Waiting", processing: "Processing", skipped: "Skipped" },
    live: {
      title: "LIVE TRACE",
      waiting: "Waiting for the first hop...",
      streaming: "Receiving in realtime",
      done: "Finished",
      stop: "Stop following",
      hops: (count) => `${count} hop${count === 1 ? "" : "s"}`,
      tracking: (service) => `Tracking in realtime: ${service}`,
      clearTracking: "Show all",
      clickToTrack: "click for details · track only that service in realtime",
      idle: "idle",
      idleHint: "Press “Run realtime” to watch the request travel through each service.",
      sent: (method, path, caseName, trace) => `Client sends ${method} ${path} · case “${caseName}” · trace ${trace}`,
      received: (status, statusText, total) => `Client received ${status ?? "—"} ${statusText} · total ${total}`.replace("  ", " "),
      error: (service, message) => `${service} failed · ${message}`,
      skipped: (service) => `${service} · skipped`,
      result: "Result",
      resultPass: (expected, actual) => `Pass · expected ${expected}, got ${actual ?? "—"}`,
      resultFail: (expected, actual) => `Fail · expected ${expected}, got ${actual ?? "—"}`,
      status: {
        last: "last run",
        sending: "sending request...",
        toService: (service) => `request heading to ${service}`,
        returning: "response on its way back",
      },
    },
    actions: {
      copyCurl: "Copy cURL",
      curlCopied: "cURL copied (replace <ACCESS_TOKEN> with a real token)",
      runRealtime: "Run realtime",
      rerunRealtime: "Run again",
      runRealtimeNoScenario: "No test scenario for this endpoint yet",
      runRealtimeError: "Could not run the test scenario.",
    },
    verdict: {
      pass: "Pass",
      fail: (expected, actual) => `Fail — expected ${expected}, got ${actual ?? "no response"}`,
      pending: "Running...",
    },
    waterfall: {
      title: "Flow across microservices",
      timeStart: "0ms",
      timeEnd: (totalMs) => `${totalMs}ms`,
    },
    span: {
      noBody: "(no body)",
      calledFrom: "called from",
      via: "via",
      processingHint: (service) => `${service} is processing...`,
      errorTitle: "Error at this service:",
      hintTitle: "Suggested fix:",
      hints: {
        timeout: (service, operation) =>
          `${service} responded slowly on ${operation}. Check slow queries/indexes and replica count, then raise the timeout or add caching.`,
        unavailable: (service) =>
          `${service} could not be reached. Check that it is running, its address/port and the network between containers.`,
        server: (service) => `${service} hit an internal error. Look at this service's logs by trace ID.`,
        client: (service) => `${service} rejected the request. Check the payload, token and the caller's permissions.`,
      },
      tabs: { req: "Request", res: "Response", processing: "Processing" },
      callFlow: { client: "Client (Web / App)" },
      requestTab: { body: "Body" },
      responseTab: { responseTime: "Response time", size: "Size", body: "Body" },
      processingTab: {
        metrics: { start: "Start", duration: "Duration", percentOfTrace: "% of trace" },
        childrenTitle: "Child hops",
        noChildren: "This hop doesn't call any other service.",
      },
    },
  },
  usageGuide: {
    steps: [
      {
        n: 1,
        title: "Filter by status",
        body: "Use the \"5xx errors\" / \"4xx errors\" / \"Slow\" / \"Successful\" chips to narrow the list, or type in the search box to filter by endpoint. New requests appear at the top of the list live, no reload needed.",
      },
      {
        n: 2,
        title: "Inspect the flow across services",
        body: "Click a row to open the detail popup — the waterfall shows every hop across microservices (built from real request_logs data); click a hop to see its real request/response body in the Request/Response columns, plus timing in the Processing section. Use Previous/Next to move to another request in the currently filtered list.",
      },
    ],
    warning:
      "The list only shows HTTP requests coming in through the API Gateway — internal RPC calls between services only appear inside their parent request's waterfall, not as their own row in the list.",
  },
};

export const loggerDictionary: Record<Language, LoggerDictionary> = { vi, en };
