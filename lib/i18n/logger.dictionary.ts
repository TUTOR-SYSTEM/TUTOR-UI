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
  detail: {
    headerTitle: string;
    headerPosition: (index: number, total: number) => string;
    escHint: string;
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
    waterfall: { title: string; timeStart: string; timeEnd: (totalMs: number) => string };
    span: {
      noBody: string;
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
  detail: {
    headerTitle: "Chi tiết request",
    headerPosition: (index, total) => `Request ${index} / ${total}`,
    escHint: "Esc để đóng",
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
    waterfall: {
      title: "Luồng qua microservice",
      timeStart: "0ms",
      timeEnd: (totalMs) => `${totalMs}ms`,
    },
    span: {
      noBody: "(không có body)",
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
        body: "Bấm 1 dòng để mở popup — waterfall hiển thị toàn bộ hop xuyên các microservice (dựng từ dữ liệu thật ghi ở bảng request_logs), bấm 1 hop để xem body request/response thật ở 2 tab Request/Response, hoặc xem thời điểm/tỷ lệ thời gian ở tab Xử lý. Dùng nút Trước/Sau để chuyển sang request khác trong danh sách đang lọc.",
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
  detail: {
    headerTitle: "Request detail",
    headerPosition: (index, total) => `Request ${index} / ${total}`,
    escHint: "Esc to close",
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
    waterfall: {
      title: "Flow across microservices",
      timeStart: "0ms",
      timeEnd: (totalMs) => `${totalMs}ms`,
    },
    span: {
      noBody: "(no body)",
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
        body: "Click a row to open the detail popup — the waterfall shows every hop across microservices (built from real request_logs data); click a hop to see its real request/response body in the Request/Response tabs, or timing in the Processing tab. Use Previous/Next to move to another request in the currently filtered list.",
      },
    ],
    warning:
      "The list only shows HTTP requests coming in through the API Gateway — internal RPC calls between services only appear inside their parent request's waterfall, not as their own row in the list.",
  },
};

export const loggerDictionary: Record<Language, LoggerDictionary> = { vi, en };
