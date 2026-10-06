import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RequestDetailDialog } from "@/components/logger/request-detail-dialog";
import { loggerDictionary } from "@/lib/i18n/logger.dictionary";
import type { ApiRequestLog, ApiTestScenario } from "@/types";

const copy = loggerDictionary.vi;

const log = (over: Partial<ApiRequestLog>): ApiRequestLog => ({
  id: "g",
  serviceName: "gateway",
  type: "HTTP",
  method: "POST",
  path: "/auth/login",
  statusCode: 200,
  durationMs: 80,
  correlationId: "c1",
  traceId: "t-g",
  parentTraceId: null,
  userId: null,
  ip: null,
  requestBody: '{"email":"a@b.c"}',
  responseBody: '{"ok":true}',
  errorMessage: null,
  createdAt: "2030-01-01T10:00:00.300Z",
  ...over,
});

const trace = [
  log({}),
  log({
    id: "u",
    serviceName: "user-service",
    type: "RPC",
    method: null,
    path: "auth.login",
    traceId: "t-u",
    parentTraceId: "t-g",
    durationMs: 50,
    requestBody: '{"rpc":1}',
    responseBody: '{"user":2}',
    createdAt: "2030-01-01T10:00:00.250Z",
  }),
];

const scenario = {
  id: "s1",
  method: "POST",
  path: "/auth/login",
  name: "Request hợp lệ",
  category: "valid",
  expectedStatus: 200,
  requestTemplate: {},
} as ApiTestScenario;

describe("RequestDetailDialog — services variant", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  const renderServices = () =>
    render(
      <RequestDetailDialog
        variant="services"
        filteredRequests={[]}
        selectedCorrelationId="c1"
        onSelectCorrelationId={vi.fn()}
        onClose={vi.fn()}
        spanIdx={0}
        onSpanIdxChange={vi.fn()}
        trace={trace}
        isTraceLoading={false}
        realtime={{ scenario, live: null, isStarting: false, onRun: vi.fn(), hasRun: true }}
        copy={copy}
      />,
    );

  it("shows a Request/Response panel per service and hides waterfall, summary and prev/next", () => {
    renderServices();

    expect(screen.getAllByText(copy.detail.span.tabs.req)).toHaveLength(2);
    expect(screen.getAllByText(copy.detail.span.tabs.res)).toHaveLength(2);
    expect(screen.queryByText(copy.detail.waterfall.title)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.detail.span.tabs.processing)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.detail.prev })).not.toBeInTheDocument();
  });

  it("keeps the 'Chạy realtime' label and shows the stored run's verdict and log lines", () => {
    renderServices();

    expect(screen.getByRole("button", { name: copy.detail.actions.runRealtime })).toBeInTheDocument();
    expect(screen.getByText(copy.detail.verdict.pass)).toBeInTheDocument();
    expect(screen.getByText(copy.detail.live.status.last)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(copy.detail.live.result))).toBeInTheDocument();
  });
});
