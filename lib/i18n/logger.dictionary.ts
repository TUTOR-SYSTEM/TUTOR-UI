import type { Language } from "@/types";

export type LoggerDictionary = {
  page: {
    title: string;
    subtitle: string;
    totalSuffix: (count: number) => string;
  };
  filters: {
    searchPlaceholder: string;
    errorOnlyLabel: string;
  };
  table: {
    index: string;
    request: string;
    occurrenceHint: (count: number) => string;
    status: string;
    duration: string;
    durationSortHint: string;
    replayColumn: string;
    hasRedactedToast: string;
    loading: string;
    error: string;
    empty: string;
    expandHint: string;
    subCaseSectionTitle: (count: number) => string;
    subCaseSuccessLabel: string;
    subCaseCheckButton: string;
    subCaseNone: string;
  };
  badge: {
    error: string;
    slowest: string;
    pass: string;
    failed: string;
  };
  trace: {
    title: string;
    subtitle: (correlationId: string) => string;
    closeButton: string;
    loading: string;
    error: string;
    empty: string;
    hopCountSuffix: (count: number) => string;
    requestBodyLabel: string;
    noBody: string;
    refresh: string;
    viewTracking: string;
    trackingTitle: string;
  };
  replay: {
    sectionTitle: string;
    warning: string;
    bodyLabel: string;
    sendButton: (method: string) => string;
    confirmSend: (method: string, path: string) => string;
    invalidJson: string;
    sendFailed: string;
    resultSuccess: (statusCode?: number) => string;
    resultError: (statusCode?: number) => string;
    fieldsTitle: string;
    noBodyFields: string;
    rawBodyLabel: string;
    fieldRequired: string;
    invalidNumber: string;
    sensitiveFieldHint: string;
    sensitiveFieldPlaceholder: (key: string) => string;
    showValue: string;
    hideValue: string;
    viewNewTrace: string;
  };
  usageGuide: {
    steps: {
      n: number;
      title: string;
      body: string;
    }[];
    warning: string;
  };
};

const vi: LoggerDictionary = {
  page: {
    title: "Nhật ký request",
    subtitle:
      "Danh sách request HTTP đi vào qua gateway — bấm \"Gửi lại & theo dõi\" trên 1 request để xem đầy đủ hop xuyên các service khác.",
    totalSuffix: (count) => `${count} bản ghi`,
  },
  filters: {
    searchPlaceholder: "Tìm theo đường dẫn (path)...",
    errorOnlyLabel: "Chỉ hiện lỗi (trang hiện tại)",
  },
  table: {
    index: "STT",
    request: "Request",
    occurrenceHint: (count) =>
      `Endpoint này xuất hiện ${count} lần trong dữ liệu trang hiện tại — chỉ hiện bản ghi gần nhất.`,
    status: "Mã trạng thái",
    duration: "Thời lượng",
    durationSortHint: "Bấm để sắp xếp theo thời lượng (trang hiện tại)",
    replayColumn: "Gửi lại & theo dõi",
    hasRedactedToast:
      "Request này có trường nhạy cảm bị ẩn trong log (vd password) — mở trace để nhập giá trị thật rồi gửi thủ công.",
    loading: "Đang tải nhật ký...",
    error: "Không thể tải nhật ký request.",
    empty: "Không tìm thấy bản ghi nào phù hợp.",
    expandHint: "Xem các case pass/failed của endpoint này",
    subCaseSectionTitle: (count) =>
      `${count} case quan sát được từ log (trang hiện tại) — bấm Kiểm tra để gửi thật và xác nhận lại`,
    subCaseSuccessLabel: "Thành công",
    subCaseCheckButton: "Kiểm tra",
    subCaseNone: "Chưa ghi nhận case nào cho endpoint này trong trang hiện tại.",
  },
  badge: {
    error: "Lỗi",
    slowest: "Chậm nhất",
    pass: "Pass",
    failed: "Failed",
  },
  trace: {
    title: "Chi tiết trace",
    subtitle: (correlationId) => `Correlation ID: ${correlationId}`,
    closeButton: "Đóng",
    loading: "Đang tải trace...",
    error: "Không thể tải trace.",
    empty: "Không tìm thấy hop nào cho correlation ID này.",
    hopCountSuffix: (count) => `${count} hop`,
    requestBodyLabel: "Request body đã gửi",
    noBody: "Không có body",
    refresh: "Làm mới",
    viewTracking: "Xem tracking",
    trackingTitle: "Tracking qua các service",
  },
  replay: {
    sectionTitle: "Gửi lại để kiểm tra",
    warning:
      "Đây là request THẬT — sẽ gọi thẳng vào gateway bằng token đang đăng nhập. Chỉ áp dụng cho hop gọi qua HTTP (không thể gửi lại hop RPC nội bộ giữa các service).",
    bodyLabel: "Các field trong body (sửa từng field trước khi gửi)",
    sendButton: (method) => `Gửi ${method}`,
    confirmSend: (method, path) =>
      `Gửi thật request ${method} ${path}? Hành động này có thể thay đổi dữ liệu thật, không thể hoàn tác.`,
    invalidJson: "Không phải JSON hợp lệ.",
    sendFailed: "Gửi request thất bại.",
    resultSuccess: (statusCode) => `Thành công (status ${statusCode ?? "—"})`,
    resultError: (statusCode) => `Lỗi (status ${statusCode ?? "—"})`,
    fieldsTitle: "Field",
    noBodyFields: "Request này không có field nào trong body.",
    rawBodyLabel: "Body thô (không phải object phẳng)",
    fieldRequired: "Không được để trống.",
    invalidNumber: "Phải là một số.",
    sensitiveFieldHint:
      "BE tự ẩn giá trị thật của trường này thành \"[REDACTED]\" trước khi lưu log (đúng thực hành bảo mật) — không thể khôi phục, cần nhập lại giá trị thật để gửi thành công.",
    sensitiveFieldPlaceholder: (key) => `Nhập ${key} thật...`,
    showValue: "Hiện giá trị",
    hideValue: "Ẩn giá trị",
    viewNewTrace: "Xem tracking lần gửi này",
  },
  usageGuide: {
    steps: [
      {
        n: 1,
        title: "Chỉ xem request HTTP ở gateway",
        body: "Danh sách chỉ hiện request HTTP đi vào qua gateway, mỗi endpoint (method + path) chỉ 1 dòng đại diện cho lần gọi gần nhất — badge \"×N\" cho biết endpoint đó xuất hiện bao nhiêu lần trong trang hiện tại. Gõ một phần đường dẫn vào ô tìm kiếm để lọc thêm.",
      },
      {
        n: 2,
        title: "Xem request lỗi",
        body: "Bật \"Chỉ hiện lỗi\" để lọc các dòng có mã trạng thái ≥ 400 hoặc có thông báo lỗi trên trang hiện tại.",
      },
      {
        n: 3,
        title: "Tìm hop chậm",
        body: "Bấm vào tiêu đề cột Thời lượng để sắp xếp các dòng đang hiển thị theo thời gian xử lý.",
      },
      {
        n: 4,
        title: "Gửi lại & theo dõi",
        body: "Bấm nút ở cột \"Gửi lại & theo dõi\" để mở popup chi tiết request đó — bấm \"Xem tracking\" để mở popup thứ 2 liệt kê tất cả hop qua từng service, chọn 1 hop để quay lại popup chính xem body/status của đúng hop đó. Sau khi bấm Gửi, popup tự chuyển sang theo dõi kết quả của lần gửi mới.",
      },
      {
        n: 5,
        title: "Kiểm tra case pass/failed",
        body: "Bấm mũi tên đầu dòng để mở rộng danh sách case (vd endpoint /auth/login có thể có case đăng nhập thành công, sai email, sai mật khẩu...) đã quan sát được từ log của endpoint đó trên trang hiện tại — bấm \"Kiểm tra\" ở từng case để gửi thật lại request đó và xác nhận Pass/Failed dựa trên kết quả sống từ service.",
      },
    ],
    warning:
      "BE `/logs` không hỗ trợ filter theo lỗi hay sort theo thời lượng — \"Chỉ hiện lỗi\" và sắp xếp cột Thời lượng chỉ áp dụng trên dữ liệu trang hiện tại, không phải toàn bộ dataset.",
  },
};

const en: LoggerDictionary = {
  page: {
    title: "Request logs",
    subtitle:
      "List of HTTP requests coming in through the gateway — click \"Resend & track\" on one to see the full hop chain across other services.",
    totalSuffix: (count) => `${count} records`,
  },
  filters: {
    searchPlaceholder: "Search by path...",
    errorOnlyLabel: "Errors only (current page)",
  },
  table: {
    index: "No.",
    request: "Request",
    occurrenceHint: (count) =>
      `This endpoint appears ${count} times in the current page's data — only the most recent record is shown.`,
    status: "Status code",
    duration: "Duration",
    durationSortHint: "Click to sort by duration (current page)",
    replayColumn: "Resend & track",
    hasRedactedToast:
      "This request has a sensitive field redacted in the log (e.g. password) — open its trace to enter the real value and send it manually.",
    loading: "Loading logs...",
    error: "Failed to load request logs.",
    empty: "No matching records found.",
    expandHint: "View pass/failed cases for this endpoint",
    subCaseSectionTitle: (count) =>
      `${count} case(s) observed in the log (current page) — click Check to send a real request and reconfirm`,
    subCaseSuccessLabel: "Success",
    subCaseCheckButton: "Check",
    subCaseNone: "No case recorded for this endpoint on the current page.",
  },
  badge: {
    error: "Error",
    slowest: "Slowest",
    pass: "Pass",
    failed: "Failed",
  },
  trace: {
    title: "Trace detail",
    subtitle: (correlationId) => `Correlation ID: ${correlationId}`,
    closeButton: "Close",
    loading: "Loading trace...",
    error: "Failed to load trace.",
    empty: "No hops found for this correlation ID.",
    hopCountSuffix: (count) => `${count} hops`,
    requestBodyLabel: "Request body sent",
    noBody: "No body",
    refresh: "Refresh",
    viewTracking: "View tracking",
    trackingTitle: "Cross-service tracking",
  },
  replay: {
    sectionTitle: "Resend to test",
    warning:
      "This is a REAL request — it calls the gateway directly using your current login token. Only available for HTTP hops (internal RPC hops between services can't be replayed).",
    bodyLabel: "Body fields (edit each field before sending)",
    sendButton: (method) => `Send ${method}`,
    confirmSend: (method, path) =>
      `Really send ${method} ${path}? This may change real data and cannot be undone.`,
    invalidJson: "Not valid JSON.",
    sendFailed: "Failed to send request.",
    resultSuccess: (statusCode) => `Success (status ${statusCode ?? "—"})`,
    resultError: (statusCode) => `Error (status ${statusCode ?? "—"})`,
    fieldsTitle: "Field",
    noBodyFields: "This request has no body fields.",
    rawBodyLabel: "Raw body (not a flat object)",
    fieldRequired: "Can't be empty.",
    invalidNumber: "Must be a number.",
    sensitiveFieldHint:
      "The backend redacts this field's real value to \"[REDACTED]\" before storing the log (correct security practice) — it can't be recovered, so type the real value to send successfully.",
    sensitiveFieldPlaceholder: (key) => `Enter the real ${key}...`,
    showValue: "Show value",
    hideValue: "Hide value",
    viewNewTrace: "View tracking for this send",
  },
  usageGuide: {
    steps: [
      {
        n: 1,
        title: "Only HTTP requests at the gateway",
        body: "The list only shows HTTP requests coming in through the gateway, one row per endpoint (method + path) representing its most recent call — the \"×N\" badge shows how many times that endpoint appears on the current page. Type part of a path into the search box to narrow it further.",
      },
      {
        n: 2,
        title: "Find failed requests",
        body: "Toggle \"Errors only\" to filter rows with status code ≥ 400 or an error message on the current page.",
      },
      {
        n: 3,
        title: "Find slow hops",
        body: "Click the Duration column header to sort the currently displayed rows by processing time.",
      },
      {
        n: 4,
        title: "Resend & track",
        body: "Click the \"Resend & track\" button to open that request's detail popup — click \"View tracking\" to open a second popup listing every hop across services, pick one to go back to the main popup with that hop's body/status. After you click Send, the popup automatically switches to tracking the result of the new call.",
      },
      {
        n: 5,
        title: "Check pass/failed cases",
        body: "Click the arrow at the start of a row to expand the cases observed for that endpoint in the current page's log (e.g. /auth/login might have a successful login, wrong email, wrong password case...) — click \"Check\" on any case to actually resend it and confirm Pass/Failed from the service's live response.",
      },
    ],
    warning:
      "The `/logs` backend doesn't support filtering by error or sorting by duration — \"Errors only\" and the Duration column sort only apply to the current page's data, not the whole dataset.",
  },
};

export const loggerDictionary: Record<Language, LoggerDictionary> = {
  vi,
  en,
};
