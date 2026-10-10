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
    createCase: string;
    fixturesButton: string;
    generateButton: string;
    tabs: { endpoints: string; coverage: string };
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
    addCase: (path: string) => string;
    generateFor: (path: string) => string;
    actions: {
      menu: (name: string) => string;
      edit: string;
      duplicate: string;
      history: string;
      delete: string;
    };
  };
  editor: {
    titleCreate: string;
    titleEdit: string;
    subtitle: string;
    cancel: string;
    submitCreate: string;
    submitEdit: string;
    fields: {
      service: string;
      method: string;
      path: string;
      pathHint: string;
      name: string;
      namePlaceholder: string;
      description: string;
      category: string;
      expectedStatus: string;
      headers: string;
      headersHint: string;
      body: string;
      bodyHint: string;
      authProfile: string;
      authProfileHint: string;
      variables: string;
    };
    errors: Record<"required" | "path" | "status" | "json" | "headersObject", string>;
    duplicateName: (name: string) => string;
    created: (name: string) => string;
    saved: (name: string) => string;
    saveError: string;
  };
  deleteDialog: {
    title: string;
    description: (name: string, method: string, path: string) => string;
    confirm: string;
    deleted: (name: string) => string;
    error: string;
  };
  authProfiles: {
    label: Record<"caller" | "admin" | "tutor" | "student" | "parent" | "none", string>;
    notConfigured: string;
  };
  history: {
    requestPath: string;
    title: (name: string) => string;
    subtitle: (method: string, path: string, expected: number) => string;
    close: string;
    columns: { time: string; status: string; result: string; duration: string };
    passed: string;
    failed: string;
    noResponse: string;
    responseBody: string;
    errorMessage: string;
    noBody: string;
    viewTrace: string;
    empty: string;
    loading: string;
    error: string;
  };
  fixtures: {
    title: string;
    subtitle: string;
    close: string;
    accountsTitle: string;
    accountConfigured: (email: string) => string;
    accountMissing: (env: string) => string;
    fixturesTitle: string;
    add: string;
    columns: { key: string; source: string; value: string; actions: string };
    sourceValue: string;
    sourceResolver: (profile: string, path: string, extract: string) => string;
    notResolved: string;
    resolvedAt: (when: string) => string;
    resolve: string;
    resolved: (key: string, value: string) => string;
    resolveError: string;
    edit: (key: string) => string;
    delete: (key: string) => string;
    empty: string;
    loading: string;
    error: string;
  };
  fixtureEditor: {
    titleCreate: string;
    titleEdit: string;
    subtitle: string;
    cancel: string;
    submit: string;
    fields: {
      key: string;
      keyHint: string;
      description: string;
      mode: string;
      modeValue: string;
      modeResolver: string;
      value: string;
      path: string;
      authProfile: string;
      extract: string;
      extractHint: string;
    };
    errors: Record<"required" | "key" | "path", string>;
    created: (key: string) => string;
    saved: (key: string) => string;
    saveError: string;
  };
  fixtureDelete: {
    title: string;
    description: (key: string) => string;
    confirm: string;
    deleted: (key: string) => string;
    error: string;
  };
  coverage: {
    summary: (covered: number, applicable: number) => string;
    routesComplete: (done: number, total: number) => string;
    passing: (passing: number, covered: number) => string;
    onlyMissing: string;
    generateAllMissing: string;
    columns: { method: string; endpoint: string; actions: string };
    status: Record<"pass" | "fail" | "never" | "missing" | "na", string>;
    cellTitle: (category: string, status: string, cases: number) => string;
    generateMissingFor: (path: string) => string;
    empty: string;
    loading: string;
    error: string;
  };
  generator: {
    title: string;
    subtitle: string;
    cancel: string;
    scopeAll: string;
    scopeSome: (routes: number) => string;
    categories: string;
    preview: string;
    submit: (count: number) => string;
    columns: { case: string; request: string; profile: string; expected: string };
    exists: string;
    selectAll: string;
    selected: (selected: number, total: number) => string;
    noProposals: string;
    writeValidHint: string;
    fixturesTitle: string;
    fixtureMissing: string;
    fixtureReady: string;
    createFixture: (key: string) => string;
    saved: (created: number, skipped: number) => string;
    nothingSelected: string;
    previewError: string;
    saveError: string;
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
    createCase: "Tạo case",
    fixturesButton: "Fixture & tài khoản test",
    generateButton: "Sinh case tự động",
    tabs: { endpoints: "Endpoint", coverage: "Độ phủ" },
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
    addCase: (path) => `Thêm case cho ${path}`,
    generateFor: (path) => `Sinh case tự động cho ${path}`,
    actions: {
      menu: (name) => `Thao tác với "${name}"`,
      edit: "Sửa",
      duplicate: "Nhân bản",
      history: "Lịch sử chạy",
      delete: "Xoá",
    },
  },
  editor: {
    titleCreate: "Tạo test case",
    titleEdit: "Sửa test case",
    subtitle: "Request được bắn thật tới gateway; case đạt khi status nhận về đúng status kỳ vọng.",
    cancel: "Huỷ",
    submitCreate: "Lưu case mới",
    submitEdit: "Lưu thay đổi",
    fields: {
      service: "Service phụ trách",
      method: "Method",
      path: "Path",
      pathHint: "Path thật kèm query; thay :id bằng {{fixture.classId}} hoặc {{unknownUuid}}.",
      name: "Tên case",
      namePlaceholder: "VD: Thiếu email",
      description: "Mô tả",
      category: "Loại case",
      expectedStatus: "Status kỳ vọng",
      headers: "Headers (JSON)",
      headersHint:
        "{{accessToken}} = token của auth profile. Bỏ trống thì token vẫn tự gắn (trừ case Xác thực chạy bằng token của bạn).",
      body: "Body (JSON)",
      bodyHint: "Bỏ trống nếu không gửi body. GET/DELETE không bao giờ gửi body.",
      authProfile: "Chạy với token của",
      authProfileHint: "Chọn role để test phân quyền (vd học sinh gọi route admin → 403).",
      variables:
        "Biến dùng được ở path, headers, body: {{accessToken}} · {{token.student}} · {{fixture.<key>}} · {{uuid}} · {{unknownUuid}} · {{timestamp}} · {{random.email}} · {{random.string}}",
    },
    errors: {
      required: "Không được bỏ trống",
      path: "Path phải bắt đầu bằng đúng một dấu /",
      status: "Status phải là số nguyên từ 100 đến 599",
      json: "JSON không hợp lệ",
      headersObject: "Headers phải là object với giá trị là chuỗi",
    },
    duplicateName: (name) => `${name} (bản sao)`,
    created: (name) => `Đã tạo case "${name}"`,
    saved: (name) => `Đã lưu case "${name}"`,
    saveError: "Không lưu được test case.",
  },
  deleteDialog: {
    title: "Xoá test case",
    description: (name, method, path) =>
      `Xoá case "${name}" của ${method} ${path}? Toàn bộ lịch sử chạy của case cũng bị xoá.`,
    confirm: "Xoá case",
    deleted: (name) => `Đã xoá case "${name}"`,
    error: "Không xoá được test case.",
  },
  authProfiles: {
    label: {
      caller: "Tôi (admin đang bấm)",
      admin: "Admin test",
      tutor: "Gia sư test",
      student: "Học sinh test",
      parent: "Phụ huynh test",
      none: "Không token",
    },
    notConfigured: "chưa cấu hình",
  },
  history: {
    requestPath: "Request",
    title: (name) => `Lịch sử chạy · ${name}`,
    subtitle: (method, path, expected) => `${method} ${path} · kỳ vọng ${expected}`,
    close: "Đóng",
    columns: { time: "Thời điểm", status: "Status", result: "Kết quả", duration: "Thời lượng" },
    passed: "Đạt",
    failed: "Lỗi",
    noResponse: "không có phản hồi",
    responseBody: "Response body",
    errorMessage: "Lỗi kết nối",
    noBody: "Không có body (hoặc lần chạy trước khi lưu body).",
    viewTrace: "Xem trace",
    empty: "Case này chưa chạy lần nào.",
    loading: "Đang tải lịch sử chạy...",
    error: "Không tải được lịch sử chạy.",
  },
  fixtures: {
    title: "Fixture & tài khoản test",
    subtitle: "Giá trị dùng chung cho các case ({{fixture.<key>}}) và tài khoản chạy theo role.",
    close: "Đóng",
    accountsTitle: "Tài khoản test theo role",
    accountConfigured: (email) => email,
    accountMissing: (env) => `Chưa cấu hình — đặt ${env}=email:mật_khẩu ở third-service`,
    fixturesTitle: "Fixture",
    add: "Thêm fixture",
    columns: { key: "Key", source: "Nguồn", value: "Giá trị", actions: "Thao tác" },
    sourceValue: "Giá trị cố định",
    sourceResolver: (profile, path, extract) => `GET ${path} (${profile}) → ${extract}`,
    notResolved: "Chưa resolve",
    resolvedAt: (when) => `resolve lúc ${when}`,
    resolve: "Resolve lại",
    resolved: (key, value) => `${key} = ${value}`,
    resolveError: "Không resolve được fixture.",
    edit: (key) => `Sửa fixture ${key}`,
    delete: (key) => `Xoá fixture ${key}`,
    empty: "Chưa có fixture nào.",
    loading: "Đang tải fixture...",
    error: "Không tải được fixture.",
  },
  fixtureEditor: {
    titleCreate: "Thêm fixture",
    titleEdit: "Sửa fixture",
    subtitle: "Dùng trong case dưới dạng {{fixture.<key>}}.",
    cancel: "Huỷ",
    submit: "Lưu fixture",
    fields: {
      key: "Key",
      keyHint: "Chữ, số và _, bắt đầu bằng chữ — vd classId.",
      description: "Mô tả",
      mode: "Lấy giá trị bằng",
      modeValue: "Giá trị cố định",
      modeResolver: "Gọi API",
      value: "Giá trị",
      path: "GET path",
      authProfile: "Gọi bằng token của",
      extract: "Đường dẫn trong JSON",
      extractHint: "Dot path, số là chỉ số mảng — vd data.classes.0.id. Kết quả được cache tới khi bấm Resolve lại.",
    },
    errors: {
      required: "Không được bỏ trống",
      key: "Chỉ chữ, số và _, bắt đầu bằng chữ",
      path: "Path phải bắt đầu bằng đúng một dấu /",
    },
    created: (key) => `Đã thêm fixture ${key}`,
    saved: (key) => `Đã lưu fixture ${key}`,
    saveError: "Không lưu được fixture.",
  },
  coverage: {
    summary: (covered, applicable) =>
      `${covered}/${applicable} ô có case (${applicable ? Math.round((covered / applicable) * 100) : 0}%)`,
    routesComplete: (done, total) => `${done}/${total} route đủ loại case`,
    passing: (passing, covered) => `${passing}/${covered} ô đang đạt`,
    onlyMissing: "Chỉ route còn thiếu",
    generateAllMissing: "Sinh case cho mọi route thiếu",
    columns: { method: "Method", endpoint: "Route", actions: "Thao tác" },
    status: { pass: "Đạt", fail: "Lỗi", never: "Chưa chạy", missing: "Thiếu", na: "Không áp dụng" },
    cellTitle: (category, status, cases) => `${category}: ${status}${cases ? ` · ${cases} case` : ""}`,
    generateMissingFor: (path) => `Sinh case còn thiếu cho ${path}`,
    empty: "Không có route nào phù hợp.",
    loading: "Đang tải route...",
    error: "Không tải được danh sách route.",
  },
  generator: {
    title: "Sinh case tự động",
    subtitle:
      "Đọc metadata của route (@Public, @Roles, ParseUUIDPipe, Zod schema) để đề xuất case xác thực, sai schema, 404 và GET hợp lệ.",
    cancel: "Huỷ",
    scopeAll: "Mọi route của gateway",
    scopeSome: (routes) => `${routes} route đã chọn`,
    categories: "Loại case",
    preview: "Xem trước",
    submit: (count) => `Lưu ${count} case`,
    columns: { case: "Case", request: "Request", profile: "Token", expected: "Kỳ vọng" },
    exists: "đã có",
    selectAll: "Chọn tất cả case mới",
    selected: (selected, total) => `Đã chọn ${selected}/${total} case`,
    noProposals: "Không sinh được case nào cho phạm vi này.",
    writeValidHint:
      "Case hợp lệ của POST/PUT/PATCH cần dữ liệu thật nên không sinh tự động — hãy viết tay (nút +).",
    fixturesTitle: "Fixture các case này dùng",
    fixtureMissing: "chưa có — case dùng nó sẽ lỗi khi chạy",
    fixtureReady: "đã có",
    createFixture: (key) => `Tạo fixture ${key}`,
    saved: (created, skipped) => `Đã tạo ${created} case${skipped ? `, bỏ qua ${skipped} case trùng` : ""}`,
    nothingSelected: "Chưa chọn case nào.",
    previewError: "Không sinh được case.",
    saveError: "Không lưu được các case.",
  },
  fixtureDelete: {
    title: "Xoá fixture",
    description: (key) => `Xoá fixture ${key}? Case đang dùng {{fixture.${key}}} sẽ lỗi khi chạy.`,
    confirm: "Xoá fixture",
    deleted: (key) => `Đã xoá fixture ${key}`,
    error: "Không xoá được fixture.",
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
    createCase: "New case",
    fixturesButton: "Fixtures & test accounts",
    generateButton: "Generate cases",
    tabs: { endpoints: "Endpoints", coverage: "Coverage" },
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
    addCase: (path) => `Add a case for ${path}`,
    generateFor: (path) => `Generate cases for ${path}`,
    actions: {
      menu: (name) => `Actions for "${name}"`,
      edit: "Edit",
      duplicate: "Duplicate",
      history: "Run history",
      delete: "Delete",
    },
  },
  editor: {
    titleCreate: "New test case",
    titleEdit: "Edit test case",
    subtitle: "The request is fired for real at the gateway; the case passes when the status matches.",
    cancel: "Cancel",
    submitCreate: "Save new case",
    submitEdit: "Save changes",
    fields: {
      service: "Owning service",
      method: "Method",
      path: "Path",
      pathHint: "Concrete path with query; replace :id with {{fixture.classId}} or {{unknownUuid}}.",
      name: "Case name",
      namePlaceholder: "E.g. Missing email",
      description: "Description",
      category: "Case type",
      expectedStatus: "Expected status",
      headers: "Headers (JSON)",
      headersHint:
        "{{accessToken}} = the auth profile's token. Left empty, the token is still attached (except Auth cases run with your token).",
      body: "Body (JSON)",
      bodyHint: "Leave empty to send no body. GET/DELETE never send one.",
      authProfile: "Run with the token of",
      authProfileHint: "Pick a role to test permissions (e.g. a student calling an admin route → 403).",
      variables:
        "Variables for path, headers, body: {{accessToken}} · {{token.student}} · {{fixture.<key>}} · {{uuid}} · {{unknownUuid}} · {{timestamp}} · {{random.email}} · {{random.string}}",
    },
    errors: {
      required: "Required",
      path: "Path must start with a single /",
      status: "Status must be an integer from 100 to 599",
      json: "Invalid JSON",
      headersObject: "Headers must be an object of string values",
    },
    duplicateName: (name) => `${name} (copy)`,
    created: (name) => `Created case "${name}"`,
    saved: (name) => `Saved case "${name}"`,
    saveError: "Could not save the test case.",
  },
  deleteDialog: {
    title: "Delete test case",
    description: (name, method, path) =>
      `Delete case "${name}" of ${method} ${path}? Its whole run history is deleted too.`,
    confirm: "Delete case",
    deleted: (name) => `Deleted case "${name}"`,
    error: "Could not delete the test case.",
  },
  authProfiles: {
    label: {
      caller: "Me (the admin pressing Test)",
      admin: "Test admin",
      tutor: "Test tutor",
      student: "Test student",
      parent: "Test parent",
      none: "No token",
    },
    notConfigured: "not configured",
  },
  history: {
    requestPath: "Request",
    title: (name) => `Run history · ${name}`,
    subtitle: (method, path, expected) => `${method} ${path} · expects ${expected}`,
    close: "Close",
    columns: { time: "Time", status: "Status", result: "Result", duration: "Duration" },
    passed: "Pass",
    failed: "Fail",
    noResponse: "no response",
    responseBody: "Response body",
    errorMessage: "Connection error",
    noBody: "No body (or the run predates body capture).",
    viewTrace: "View trace",
    empty: "This case has never run.",
    loading: "Loading run history...",
    error: "Could not load run history.",
  },
  fixtures: {
    title: "Fixtures & test accounts",
    subtitle: "Shared values for cases ({{fixture.<key>}}) and the accounts role cases run as.",
    close: "Close",
    accountsTitle: "Per-role test accounts",
    accountConfigured: (email) => email,
    accountMissing: (env) => `Not configured — set ${env}=email:password on third-service`,
    fixturesTitle: "Fixtures",
    add: "Add fixture",
    columns: { key: "Key", source: "Source", value: "Value", actions: "Actions" },
    sourceValue: "Fixed value",
    sourceResolver: (profile, path, extract) => `GET ${path} (${profile}) → ${extract}`,
    notResolved: "Not resolved yet",
    resolvedAt: (when) => `resolved at ${when}`,
    resolve: "Resolve again",
    resolved: (key, value) => `${key} = ${value}`,
    resolveError: "Could not resolve the fixture.",
    edit: (key) => `Edit fixture ${key}`,
    delete: (key) => `Delete fixture ${key}`,
    empty: "No fixtures yet.",
    loading: "Loading fixtures...",
    error: "Could not load fixtures.",
  },
  fixtureEditor: {
    titleCreate: "Add fixture",
    titleEdit: "Edit fixture",
    subtitle: "Used in cases as {{fixture.<key>}}.",
    cancel: "Cancel",
    submit: "Save fixture",
    fields: {
      key: "Key",
      keyHint: "Letters, digits and _, starting with a letter — e.g. classId.",
      description: "Description",
      mode: "Get the value from",
      modeValue: "Fixed value",
      modeResolver: "API call",
      value: "Value",
      path: "GET path",
      authProfile: "Call with the token of",
      extract: "Path in the JSON",
      extractHint: "Dot path, numbers index arrays — e.g. data.classes.0.id. Cached until you resolve again.",
    },
    errors: {
      required: "Required",
      key: "Letters, digits and _ only, starting with a letter",
      path: "Path must start with a single /",
    },
    created: (key) => `Added fixture ${key}`,
    saved: (key) => `Saved fixture ${key}`,
    saveError: "Could not save the fixture.",
  },
  coverage: {
    summary: (covered, applicable) =>
      `${covered}/${applicable} cells have cases (${applicable ? Math.round((covered / applicable) * 100) : 0}%)`,
    routesComplete: (done, total) => `${done}/${total} routes fully covered`,
    passing: (passing, covered) => `${passing}/${covered} cells passing`,
    onlyMissing: "Only routes with gaps",
    generateAllMissing: "Generate for every route with gaps",
    columns: { method: "Method", endpoint: "Route", actions: "Actions" },
    status: { pass: "Pass", fail: "Fail", never: "Not run", missing: "Missing", na: "N/A" },
    cellTitle: (category, status, cases) => `${category}: ${status}${cases ? ` · ${cases} ${cases === 1 ? "case" : "cases"}` : ""}`,
    generateMissingFor: (path) => `Generate missing cases for ${path}`,
    empty: "No routes match.",
    loading: "Loading routes...",
    error: "Could not load routes.",
  },
  generator: {
    title: "Generate cases",
    subtitle:
      "Reads route metadata (@Public, @Roles, ParseUUIDPipe, Zod schemas) to propose auth, validation, 404 and valid GET cases.",
    cancel: "Cancel",
    scopeAll: "Every gateway route",
    scopeSome: (routes) => `${routes} selected ${routes === 1 ? "route" : "routes"}`,
    categories: "Case types",
    preview: "Preview",
    submit: (count) => `Save ${count} ${count === 1 ? "case" : "cases"}`,
    columns: { case: "Case", request: "Request", profile: "Token", expected: "Expects" },
    exists: "exists",
    selectAll: "Select all new cases",
    selected: (selected, total) => `${selected}/${total} cases selected`,
    noProposals: "No cases could be generated for this scope.",
    writeValidHint:
      "Valid POST/PUT/PATCH cases need real data, so they aren't generated — write them by hand (+ button).",
    fixturesTitle: "Fixtures these cases use",
    fixtureMissing: "missing — cases using it will fail to run",
    fixtureReady: "exists",
    createFixture: (key) => `Create fixture ${key}`,
    saved: (created, skipped) => `Created ${created} ${created === 1 ? "case" : "cases"}${skipped ? `, skipped ${skipped} duplicates` : ""}`,
    nothingSelected: "No case selected.",
    previewError: "Could not generate cases.",
    saveError: "Could not save the cases.",
  },
  fixtureDelete: {
    title: "Delete fixture",
    description: (key) => `Delete fixture ${key}? Cases using {{fixture.${key}}} will fail to run.`,
    confirm: "Delete fixture",
    deleted: (key) => `Deleted fixture ${key}`,
    error: "Could not delete the fixture.",
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
