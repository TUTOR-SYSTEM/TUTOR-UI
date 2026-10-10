import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TestMonitorList } from "@/components/test-monitor/test-monitor-list";
import { testMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type { ApiTestScenario, TestMonitorEndpointRow } from "@/types";

const copy = testMonitorDictionary.vi;

const scenario = (over: Partial<ApiTestScenario>): ApiTestScenario => ({
  id: "s1",
  service: "user-service",
  method: "POST",
  path: "/auth/login",
  name: "Request hợp lệ",
  description: null,
  requestTemplate: {},
  expectedStatus: 200,
  category: "valid",
  authProfile: "caller",
  createdAt: "",
  updatedAt: null,
  lastRun: null,
  flow: [],
  ...over,
});

const passedRun = { correlationId: "c", actualStatus: 200, passed: true, durationMs: 42, runAt: "" };
const failedRun = { correlationId: "c", actualStatus: 500, passed: false, durationMs: 900, runAt: "" };

const row = (over: Partial<TestMonitorEndpointRow> = {}): TestMonitorEndpointRow => ({
  key: "POST /auth/login",
  method: "POST",
  path: "/auth/login",
  service: "user-service",
  flowServices: [],
  cases: [
    scenario({ id: "s1", name: "Request hợp lệ", lastRun: passedRun }),
    scenario({ id: "s2", name: "Sai mật khẩu", expectedStatus: 400, category: "domain", lastRun: failedRun }),
    scenario({ id: "s3", name: "Thiếu email", expectedStatus: 422, category: "validation" }),
  ],
  casesPassed: 1,
  casesTotal: 3,
  calls24h: 25,
  errorCount24h: 2,
  p95Ms: 120,
  ...over,
});

const Harness = (props: Partial<React.ComponentProps<typeof TestMonitorList>>) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  return (
    <TestMonitorList
      rows={[row()]}
      expanded={expanded}
      onToggle={(key) =>
        setExpanded((prev) => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        })
      }
      onRun={vi.fn()}
      onRunEndpoint={vi.fn()}
      onOpenTrace={vi.fn()}
      onCaseAction={vi.fn()}
      onAddCase={vi.fn()}
      onGenerate={vi.fn()}
      runningScenarioId={null}
      isLoading={false}
      isError={false}
      copy={copy}
      {...props}
    />
  );
};

const renderList = (props: Partial<React.ComponentProps<typeof TestMonitorList>> = {}) =>
  render(<Harness {...props} />);

const parentRow = () => screen.getByText("/auth/login").closest("tr")!;

describe("TestMonitorList", () => {
  it("shows one parent row per endpoint with result, passed/total, compact calls/24h and P95", () => {
    renderList({ rows: [row({ calls24h: 4800 })] });

    expect(screen.getByText("/auth/login")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
    expect(screen.getByText("4.8K")).toBeInTheDocument();
    expect(screen.getByText("120ms")).toBeInTheDocument();
    expect(within(parentRow()).getByText(copy.list.result.err)).toBeInTheDocument();
    expect(within(parentRow()).getByText("User Service")).toBeInTheDocument();
    // children are collapsed until the row is opened
    expect(screen.queryByText("Sai mật khẩu")).not.toBeInTheDocument();
  });

  it("expands to the case rows on click and collapses again", () => {
    renderList();

    fireEvent.click(parentRow());
    expect(screen.getByText("Request hợp lệ")).toBeInTheDocument();
    expect(screen.getByText("Sai mật khẩu")).toBeInTheDocument();
    // 3 case buttons + the endpoint-level Test button
    expect(screen.getAllByRole("button", { name: copy.list.testButton })).toHaveLength(4);

    fireEvent.click(parentRow());
    expect(screen.queryByText("Sai mật khẩu")).not.toBeInTheDocument();
  });

  it("toggles once when the chevron button is clicked", () => {
    renderList();
    fireEvent.click(screen.getByRole("button", { name: copy.list.expandRow("/auth/login") }));
    expect(screen.getByText("Sai mật khẩu")).toBeInTheDocument();
  });

  it("badges each case by its latest run and shows expected vs actual status", () => {
    renderList({
      rows: [
        row({
          cases: [
            scenario({ id: "s1", name: "Hợp lệ", lastRun: passedRun }),
            scenario({ id: "s2", name: "Sai", expectedStatus: 400, lastRun: failedRun }),
            scenario({ id: "s3", name: "Mới" }),
            scenario({
              id: "s4",
              name: "Case quá lâu",
              lastRun: { ...passedRun, durationMs: 1500 },
            }),
          ],
        }),
      ],
    });
    fireEvent.click(parentRow());

    const caseRow = (name: string) => screen.getByText(name).closest("tr")!;
    expect(within(caseRow("Hợp lệ")).getByText(copy.list.result.ok)).toBeInTheDocument();
    expect(within(caseRow("Hợp lệ")).getByText("SUCCESS")).toBeInTheDocument();
    expect(within(caseRow("Sai")).getByText(copy.list.result.err)).toBeInTheDocument();
    expect(within(caseRow("Sai")).getByText("500")).toBeInTheDocument();
    expect(within(caseRow("Mới")).getByText(copy.list.neverRun)).toBeInTheDocument();
    expect(within(caseRow("Case quá lâu")).getByText(copy.list.result.slow)).toBeInTheDocument();
    expect(within(caseRow("Case quá lâu")).getByText("1.50s")).toBeInTheDocument();
  });

  it("runs the clicked case only, without opening its trace or toggling the row", () => {
    const onRun = vi.fn();
    const onOpenTrace = vi.fn();
    renderList({ onRun, onOpenTrace });
    fireEvent.click(parentRow());

    const target = screen.getByText("Request hợp lệ").closest("tr")!;
    fireEvent.click(within(target).getByRole("button", { name: copy.list.testButton }));

    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onRun.mock.calls[0][0]).toMatchObject({ id: "s1" });
    expect(onOpenTrace).not.toHaveBeenCalled();
    expect(screen.getByText("Sai mật khẩu")).toBeInTheDocument(); // still expanded
  });

  it("opens the trace of a case that has a run, but not of a never-run case", () => {
    const onOpenTrace = vi.fn();
    renderList({ onOpenTrace });
    fireEvent.click(parentRow());

    fireEvent.click(screen.getByText("Thiếu email"));
    expect(onOpenTrace).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Request hợp lệ"));
    expect(onOpenTrace).toHaveBeenCalledWith(expect.objectContaining({ id: "s1" }));
  });

  it("runs every case of the endpoint from the parent Test button", () => {
    const onRunEndpoint = vi.fn();
    renderList({ onRunEndpoint });

    fireEvent.click(within(parentRow()).getByRole("button", { name: copy.list.testButton }));
    expect(onRunEndpoint).toHaveBeenCalledWith(expect.objectContaining({ path: "/auth/login" }));
  });

  it("disables every Test button while one case is running", () => {
    renderList({ runningScenarioId: "s2" });
    fireEvent.click(parentRow());

    for (const button of screen.getAllByRole("button", { name: /Test|Đang chạy/ })) {
      expect(button).toBeDisabled();
    }
    expect(screen.getByText(copy.list.running)).toBeInTheDocument();
  });

  it("disables Test buttons during a bulk run", () => {
    renderList({ busy: true });
    expect(within(parentRow()).getByRole("button", { name: copy.list.testButton })).toBeDisabled();
  });

  it("marks endpoints with no scenarios and does not expand them", () => {
    renderList({ rows: [row({ cases: [], casesTotal: 0, casesPassed: 0, service: null })] });

    expect(screen.getByText(new RegExp(copy.list.noCases))).toBeInTheDocument();
    fireEvent.click(parentRow());
    expect(screen.queryByRole("button", { name: copy.list.testButton })).not.toBeInTheDocument();
  });

  it("renders loading, error and empty states", () => {
    const { rerender } = renderList({ rows: [], isLoading: true });
    expect(screen.getByText(copy.list.loading)).toBeInTheDocument();

    rerender(<Harness rows={[]} isError />);
    expect(screen.getByText(copy.list.error)).toBeInTheDocument();

    rerender(<Harness rows={[]} />);
    expect(screen.getByText(copy.list.empty)).toBeInTheDocument();
  });

  it("opens the add-case form for an endpoint, even one without cases", () => {
    const onAddCase = vi.fn();
    const onToggle = vi.fn();
    renderList({ rows: [row({ cases: [], casesTotal: 0, casesPassed: 0 })], onAddCase, onToggle });

    fireEvent.click(screen.getByRole("button", { name: copy.list.addCase("/auth/login") }));
    expect(onAddCase).toHaveBeenCalledWith(expect.objectContaining({ path: "/auth/login" }));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("fires case actions from the ⋮ menu without opening the trace", () => {
    const onCaseAction = vi.fn();
    const onOpenTrace = vi.fn();
    renderList({ onCaseAction, onOpenTrace });
    fireEvent.click(parentRow());

    fireEvent.click(screen.getByRole("button", { name: copy.list.actions.menu("Request hợp lệ") }));
    fireEvent.click(screen.getByRole("button", { name: copy.list.actions.history }));

    expect(onCaseAction).toHaveBeenCalledWith("history", expect.objectContaining({ id: "s1" }));
    expect(onOpenTrace).not.toHaveBeenCalled();
  });
});
