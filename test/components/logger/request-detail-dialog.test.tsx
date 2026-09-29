import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PLAYBACK_STEP_MS } from "@/hooks/useTracePlayback.hook";

import {
  RequestDetailDialog,
  type RequestDetailRealtime,
} from "@/components/logger/request-detail-dialog";
import { loggerDictionary } from "@/lib/i18n/logger.dictionary";
import type { ApiRequestLog, ApiTestScenario, LiveTraceState } from "@/types";

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
  ip: "127.0.0.1",
  requestBody: '{"email":"a@b.c"}',
  responseBody: "{}",
  errorMessage: null,
  createdAt: "2030-01-01T10:00:00.300Z",
  ...over,
});

const trace: ApiRequestLog[] = [
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
    createdAt: "2030-01-01T10:00:00.250Z",
  }),
];

const scenario = {
  id: "s1",
  method: "POST",
  path: "/auth/login",
  expectedStatus: 200,
  requestTemplate: { body: { email: "a@b.c" } },
} as ApiTestScenario;

const renderDialog = (
  props: { realtime?: RequestDetailRealtime; trace?: ApiRequestLog[]; correlationId?: string } = {},
) =>
  render(
    <RequestDetailDialog
      filteredRequests={[log({})]}
      selectedCorrelationId={props.correlationId ?? "c1"}
      onSelectCorrelationId={vi.fn()}
      onClose={vi.fn()}
      spanIdx={0}
      onSpanIdxChange={vi.fn()}
      trace={props.trace ?? trace}
      isTraceLoading={false}
      realtime={props.realtime}
      copy={copy}
    />,
  );

const realtime = (over: Partial<RequestDetailRealtime> = {}): RequestDetailRealtime => ({
  scenario,
  live: null,
  isStarting: false,
  onRun: vi.fn(),
  ...over,
});

const live = (over: Partial<LiveTraceState> = {}): LiveTraceState => ({
  correlationId: "c1",
  startedAt: Date.parse("2030-01-01T10:00:00.000Z"),
  scenario,
  rows: [],
  phase: "running",
  rootStatus: null,
  ...over,
});

describe("RequestDetailDialog — pipeline / cURL / realtime", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn(); // jsdom doesn't implement it (LIVE TRACE auto-scroll)
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("draws the horizontal pipeline CLIENT → each service from the trace", () => {
    renderDialog();
    const svg = screen.getByRole("group", { name: copy.detail.pipeline.title });

    expect(svg).toHaveTextContent(copy.detail.pipeline.client);
    expect(svg).toHaveTextContent("API Gateway");
    expect(svg).toHaveTextContent("User Service");
  });

  it("marks a failing service in the pipeline", () => {
    renderDialog({ trace: [trace[0], { ...trace[1], statusCode: 500 }] });
    expect(screen.getByRole("group", { name: copy.detail.pipeline.title })).toHaveTextContent("ERR");
  });

  it("copies a cURL command built from the root hop", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: copy.detail.actions.copyCurl }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1));
    const curl = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
    expect(curl).toContain("curl -X POST");
    expect(curl).toContain("/auth/login");
    expect(curl).toContain(`--data-raw '{"email":"a@b.c"}'`);
  });

  it("has no realtime button when the page doesn't provide one", () => {
    renderDialog();
    expect(screen.queryByRole("button", { name: copy.detail.actions.runRealtime })).not.toBeInTheDocument();
  });

  it("runs the scenario when 'Chạy realtime' is pressed", () => {
    const onRun = vi.fn();
    renderDialog({ realtime: realtime({ onRun }) });

    fireEvent.click(screen.getByRole("button", { name: copy.detail.actions.runRealtime }));
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("disables 'Chạy realtime' when the endpoint has no scenario, with an explanation", () => {
    renderDialog({ realtime: realtime({ scenario: null }) });
    const button = screen.getByRole("button", { name: copy.detail.actions.runRealtime });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", copy.detail.actions.runRealtimeNoScenario);
  });

  it("disables the run button (labelled 'Đang chạy...') while a run is still streaming", () => {
    renderDialog({ realtime: realtime({ live: live({ phase: "settling" }) }) });
    expect(screen.getByRole("button", { name: copy.detail.verdict.pending })).toBeDisabled();
  });

  it("follows a fresh run: shows LIVE TRACE lines and a pending verdict, before any trace exists", () => {
    renderDialog({
      trace: [],
      correlationId: "c-new",
      realtime: realtime({
        live: live({
          correlationId: "c-new",
          rows: [
            log({
              id: "u",
              correlationId: "c-new",
              serviceName: "user-service",
              type: "RPC",
              method: null,
              path: "auth.login",
              traceId: "t-u",
              parentTraceId: "t-g",
            }),
          ],
        }),
      }),
    });

    expect(screen.getByText(copy.detail.live.title)).toBeInTheDocument();
    // hops are only replayed once the run is complete — until then just the "sent" line shows
    expect(screen.getByText(/Client gửi POST \/auth\/login/)).toBeInTheDocument();
    expect(screen.queryByText(/→ User Service/)).not.toBeInTheDocument();
    expect(screen.getAllByText(copy.detail.verdict.pending).length).toBeGreaterThan(0);
    // the request header shows the scenario's endpoint even though the gateway row hasn't arrived
    expect(screen.getByText("/auth/login")).toBeInTheDocument();
  });

  it("keeps the pipeline on screen (pending box) while a run has produced no hop yet", () => {
    renderDialog({
      trace: [],
      correlationId: "c-new",
      realtime: realtime({ live: live({ correlationId: "c-new" }) }),
    });
    const pipeline = screen.getByRole("group", { name: copy.detail.pipeline.title });
    expect(pipeline).toHaveTextContent(copy.detail.pipeline.client);
    expect(pipeline).toHaveTextContent("…");
  });

  describe("replay of a finished run", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const doneRun = () =>
      realtime({
        live: live({ phase: "done", rootStatus: 200, rows: trace.map((r) => ({ ...r, correlationId: "c1" })) }),
      });

    it("walks the request through each service, then shows Đạt", () => {
      renderDialog({ realtime: doneRun() });

      // nothing but the "sent" line and a pending verdict until the replay advances
      expect(screen.queryByText(/→ API Gateway/)).not.toBeInTheDocument();
      expect(screen.queryByText(copy.detail.verdict.pass)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: copy.detail.verdict.pending })).toBeDisabled();

      act(() => {
        vi.advanceTimersByTime(PLAYBACK_STEP_MS);
      });
      expect(screen.getByText(/→ API Gateway · HTTP POST \/auth\/login/)).toBeInTheDocument();
      expect(screen.queryByText(/→ User Service/)).not.toBeInTheDocument();
      expect(screen.getByText(copy.detail.pipeline.processing)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(PLAYBACK_STEP_MS);
      });
      expect(screen.getByText(/→ User Service · RPC auth\.login/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(PLAYBACK_STEP_MS * 10);
      });
      expect(screen.getByText(/← User Service → API Gateway/)).toBeInTheDocument();
      expect(screen.getByText(/Client nhận 200 OK · tổng 80ms/)).toBeInTheDocument();
      expect(screen.getByText(/Kết quả: Đạt · kỳ vọng 200, nhận 200/)).toBeInTheDocument();
      expect(screen.getByText(copy.detail.verdict.pass)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: copy.detail.actions.rerunRealtime })).toBeEnabled();
    });

    it("shows the expected-vs-actual mismatch when the run failed", () => {
      const failed = [{ ...trace[0], statusCode: 500 }];
      renderDialog({
        trace: failed,
        realtime: realtime({ live: live({ phase: "done", rootStatus: 500, rows: failed }) }),
      });
      act(() => {
        vi.advanceTimersByTime(PLAYBACK_STEP_MS * 10);
      });
      expect(screen.getByText(copy.detail.verdict.fail(200, 500))).toBeInTheDocument();
    });

    it("shows the error banner with a fix hint on the failing hop once its response is back", () => {
      const failed = [
        log({ statusCode: 504, errorMessage: null }),
        log({
          id: "u",
          serviceName: "user-service",
          type: "RPC",
          method: null,
          path: "grpc://user/GetUser",
          statusCode: null,
          traceId: "t-u",
          parentTraceId: "t-g",
          durationMs: 3000,
          errorMessage: "4 DEADLINE_EXCEEDED — user-service: GetUser deadline exceeded (3000ms)",
          createdAt: "2030-01-01T10:00:00.250Z",
        }),
      ];
      renderDialog({
        trace: failed,
        realtime: realtime({ live: live({ phase: "done", rootStatus: 504, rows: failed }) }),
      });
      act(() => {
        vi.advanceTimersByTime(PLAYBACK_STEP_MS * 3); // gateway, user-service, error line → on user-service
      });
      // still processing → no banner yet, spinner instead
      expect(screen.queryByText(copy.detail.span.errorTitle)).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(PLAYBACK_STEP_MS * 10);
      });
      expect(screen.getByText(/✕ User Service lỗi · 4 DEADLINE_EXCEEDED/)).toBeInTheDocument();
      expect(screen.getByText(/Kết quả: Lỗi · kỳ vọng 200, nhận 504/)).toBeInTheDocument();
    });

    it("shows a spinner instead of the response for the hop that is still processing", () => {
      renderDialog({ realtime: doneRun() });
      act(() => {
        vi.advanceTimersByTime(PLAYBACK_STEP_MS);
      });
      expect(screen.getByText(copy.detail.span.processingHint("API Gateway"))).toBeInTheDocument();
    });
  });

  it("shows the idle LIVE TRACE hint before any run, and no live rows for a different correlation id", () => {
    renderDialog({ realtime: realtime({ live: live({ correlationId: "other", rows: [log({ id: "x" })] }) }) });
    expect(screen.getByText(copy.detail.live.idle)).toBeInTheDocument();
    expect(screen.getByText(copy.detail.live.idleHint)).toBeInTheDocument();
    expect(screen.queryByText(/→ API Gateway/)).not.toBeInTheDocument();
  });
});
