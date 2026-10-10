export type TestScenarioCategory = "valid" | "auth" | "validation" | "not_found" | "domain";

/** Token mà case chạy cùng: của admin đang bấm (`caller`), của tài khoản test theo role
 * (`TEST_ACCOUNT_<ROLE>` ở third-service), hoặc không token (`none`). */
export type TestAuthProfile = "caller" | "admin" | "tutor" | "student" | "parent" | "none";

export type TestScenarioRequestTemplate = {
  headers?: Record<string, string>;
  body?: unknown;
};

/** Lần chạy mới nhất của 1 kịch bản, đi kèm trong `GET /test-scenarios`. */
export type TestScenarioLastRun = {
  correlationId: string;
  actualStatus: number | null;
  passed: boolean;
  durationMs: number;
  runAt: string;
};

/** 1 hop của lần chạy gần nhất (theo thứ tự thời gian), đi kèm trong `GET /test-scenarios`. */
export type TestScenarioFlowHop = {
  /** `gateway` | `user-service` | `tutor-service` | `third-service`. */
  serviceName: string;
  type: "HTTP" | "RPC";
  statusCode: number | null;
  durationMs: number;
};

/** `GET /test-scenarios/meta` (admin) — thông tin môi trường đang được test. */
export type TestScenarioMeta = { environment: string };

export type ApiTestScenario = {
  id: string;
  service: string;
  method: string;
  path: string;
  name: string;
  description: string | null;
  requestTemplate: TestScenarioRequestTemplate;
  expectedStatus: number;
  category: TestScenarioCategory;
  authProfile: TestAuthProfile;
  createdAt: string;
  updatedAt: string | null;
  lastRun: TestScenarioLastRun | null;
  /** Các hop của `lastRun` theo thứ tự thời gian; `[]` khi chưa chạy lần nào. */
  flow: TestScenarioFlowHop[];
};

/** 1 hàng `test_runs` — kết quả `POST /test-scenarios/:id/run`. */
export type ApiTestRun = {
  id: string;
  scenarioId: string;
  correlationId: string;
  actualStatus: number | null;
  expectedStatus: number;
  passed: boolean;
  durationMs: number;
  errorMessage: string | null;
  /** Body phản hồi (đã che secret, cắt ~4KB); `null` khi không có hoặc lần chạy cũ. */
  responseBody?: string | null;
  /** Path thực sự đã gọi sau khi điền `{{biến}}`; `null` ở lần chạy cũ. */
  requestPath?: string | null;
  triggeredBy: string | null;
  createdAt: string;
};

export type TestScenarioMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Body `POST /test-scenarios` — khớp `createTestScenarioSchema` ở gateway. */
export type CreateTestScenarioPayload = {
  service: string;
  method: TestScenarioMethod;
  path: string;
  name: string;
  description?: string;
  requestTemplate: TestScenarioRequestTemplate;
  expectedStatus: number;
  category: TestScenarioCategory;
  authProfile: TestAuthProfile;
};

/** Body `PATCH /test-scenarios/:id` (chỉ field đổi) kèm id cho URL. */
export type UpdateTestScenarioPayload = { id: string } & Partial<CreateTestScenarioPayload>;

/** Giá trị form tạo/sửa case — headers/body giữ dạng chuỗi JSON để người dùng sửa tay. */
export type TestScenarioFormValues = {
  service: string;
  method: TestScenarioMethod;
  path: string;
  name: string;
  description: string;
  category: TestScenarioCategory;
  authProfile: TestAuthProfile;
  expectedStatus: string;
  headers: string;
  body: string;
};

/** Thao tác trong menu ⋮ của 1 case. */
export type TestMonitorCaseAction = "edit" | "duplicate" | "history" | "delete";

export type ScenarioFormField = "service" | "path" | "name" | "expectedStatus" | "headers" | "body";
/** Mã lỗi form → câu báo lỗi trong dictionary (`copy.editor.errors`). */
export type ScenarioFormError = "required" | "path" | "status" | "json" | "headersObject";

/** Dialog tạo/sửa case đang mở: `edit` kèm `scenarioId`, `create` có thể điền sẵn (nhân bản, thêm case cho 1 endpoint). */
export type TestScenarioEditorState = {
  mode: "create" | "edit";
  initial: TestScenarioFormValues;
  scenarioId?: string;
};

/** 1 hàng `GET /test-scenarios/routes` — mọi route HTTP mà gateway đang expose (đọc từ code). */
export type ApiRoute = {
  method: string;
  path: string;
  /** Tóm tắt từ Swagger (`@ApiOperation`), `null` nếu route chưa có. */
  summary: string | null;
  /** Nhóm Swagger (`@ApiTags`), `null` nếu chưa có. */
  tag: string | null;
  /** Các field dưới đây đọc từ metadata Nest — vắng khi gateway còn bản cũ. */
  params?: string[];
  /** Param có `ParseUUIDPipe` — giá trị không phải UUID → 400. */
  uuidParams?: string[];
  /** `@Public()` — gọi được không cần token. */
  isPublic?: boolean;
  /** `@Roles(...)`; `null` = mọi role đã đăng nhập. */
  roles?: string[] | null;
  /** JSON Schema (phía input) của Zod body/query; `null` = không validate. */
  bodySchema?: Record<string, unknown> | null;
  querySchema?: Record<string, unknown> | null;
  multipart?: boolean;
  /** Route redirect OAuth — không test tự động được. */
  oauth?: boolean;
};

/** 1 hàng `GET /test-scenarios/stats` — gộp theo `(method, path)`. */
export type ScenarioStats = {
  method: string;
  path: string;
  casesPassed: number;
  casesTotal: number;
};

export type TestMonitorResultFilter = "all" | "err" | "slow" | "ok";

/** 1 hàng cha của bảng test-monitor: 1 endpoint + các case con + số liệu 24h từ `request_logs`. */
export type TestMonitorEndpointRow = {
  key: string;
  method: string;
  path: string;
  /** `null` khi endpoint chỉ có traffic thật, chưa có kịch bản nào. */
  service: string | null;
  /** Tên service duy nhất theo thứ tự đi qua, lấy từ `flow` của case đầu tiên có flow; `[]` nếu chưa có. */
  flowServices: string[];
  cases: ApiTestScenario[];
  casesPassed: number;
  casesTotal: number;
  calls24h: number;
  errorCount24h: number;
  p95Ms: number;
};

/** Kết quả `POST /test-scenarios/:id/run?async=true` — trả ngay, không đợi trace hoàn tất. */
export type RunRealtimeResult = { correlationId: string; scenarioId: string };

/** Kết quả hiển thị của 1 case con: theo lần chạy gần nhất (`never` = chưa chạy lần nào). */
export type TestMonitorCaseResult = "ok" | "err" | "slow" | "never";

/** Case đang mở trong dialog trace: correlationId của lần chạy đang xem + kịch bản tương ứng. */
export type TestMonitorTraceSelection = {
  correlationId: string;
  scenario: ApiTestScenario;
};

/** Tiến độ "Test toàn bộ N case" (chạy tuần tự từng case). */
export type TestMonitorRunAllProgress = { done: number; total: number };

/** Cách lấy giá trị fixture: GET qua gateway bằng `authProfile`, rồi đọc `extract` (dot path,
 * số = chỉ số mảng, vd `data.classes.0.id`) trong JSON trả về. */
export type TestFixtureResolver = {
  method: "GET";
  path: string;
  authProfile: TestAuthProfile;
  extract: string;
};

/** 1 hàng `GET /test-scenarios/fixtures` — giá trị cho `{{fixture.<key>}}`. */
export type ApiTestFixture = {
  id: string;
  key: string;
  description: string | null;
  /** Giá trị cố định, hoặc giá trị resolve gần nhất (cache) khi có `resolver`. */
  value: string | null;
  resolver: TestFixtureResolver | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type CreateTestFixturePayload = {
  key: string;
  description?: string;
  value?: string | null;
  resolver?: TestFixtureResolver | null;
};

export type UpdateTestFixturePayload = { id: string } & Partial<CreateTestFixturePayload>;

/** 1 hàng `GET /test-scenarios/auth-profiles` — tài khoản test theo role (không có mật khẩu). */
export type ApiAuthProfileStatus = {
  profile: Exclude<TestAuthProfile, "caller" | "none">;
  configured: boolean;
  email: string | null;
};

/** Form fixture: `value` = giá trị cố định, `resolver` = lấy qua request. */
export type TestFixtureFormValues = {
  key: string;
  description: string;
  mode: "value" | "resolver";
  value: string;
  path: string;
  authProfile: TestAuthProfile;
  extract: string;
};

export type TestFixtureFormField = "key" | "value" | "path" | "extract";
export type TestFixtureFormError = "required" | "key" | "path";

/** Fixture đang mở trong form: có `fixtureId` = sửa. */
export type TestFixtureEditorState = { initial: TestFixtureFormValues; fixtureId?: string };

/** Body `POST /test-scenarios/generate` — bỏ `routes` = mọi route (trừ chính trang test). */
export type GenerateScenariosPayload = {
  routes?: { method: string; path: string }[];
  categories?: TestScenarioCategory[];
};

/** 1 case đề xuất; `exists` = đã có case cùng method + path + tên. */
export type GeneratedScenario = CreateTestScenarioPayload & { routePath: string; exists: boolean };

/** Fixture mà các case đề xuất dùng tới, kèm resolver đoán từ route danh sách (nếu có). */
export type FixtureSuggestion = {
  key: string;
  exists: boolean;
  suggestion: TestFixtureResolver | null;
};

export type GenerateScenariosResult = {
  scenarios: GeneratedScenario[];
  fixtures: FixtureSuggestion[];
};

/** Kết quả `POST /test-scenarios/bulk`. */
export type BulkCreateScenariosResult = { created: number; skipped: number };

/** Dialog sinh case đang mở: phạm vi route (`null` = mọi route) + loại case chọn sẵn. */
export type GenerateDialogState = {
  routes: { method: string; path: string }[] | null;
  categories: TestScenarioCategory[];
};

/** Trạng thái 1 ô của ma trận độ phủ (route × loại case). */
export type CoverageCellStatus = "pass" | "fail" | "never" | "missing" | "na";

export type CoverageCell = { status: CoverageCellStatus; cases: ApiTestScenario[] };

/** 1 hàng ma trận độ phủ: 1 route thật của gateway. */
export type CoverageRow = {
  key: string;
  method: string;
  path: string;
  cells: Record<TestScenarioCategory, CoverageCell>;
};

export type CoverageSummary = {
  /** Ô áp dụng được (khác `na`) / ô đã có ít nhất 1 case. */
  applicable: number;
  covered: number;
  /** Route mà mọi ô áp dụng được đều đã có case. */
  routesComplete: number;
  routesTotal: number;
  /** Ô đã chạy và mọi case trong ô đều đạt. */
  passing: number;
};

export type TestMonitorTab = "endpoints" | "coverage";
