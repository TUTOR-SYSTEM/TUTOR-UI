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
  createdAt: "",
  updatedAt: null,
  lastRun: null,
  ...over,
});

const passedRun = { correlationId: "c", actualStatus: 200, passed: true, durationMs: 42, runAt: "" };
const failedRun = { correlationId: "c", actualStatus: 500, passed: false, durationMs: 900, runAt: "" };

const row = (over: Partial<TestMonitorEndpointRow> = {}): TestMonitorEndpointRow => ({
  key: "POST /auth/login",
  method: "POST",
  path: "/auth/login",
  service: "user-service",
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

const renderList = (props: Partial<React.ComponentProps<typeof TestMonitorList>> = {}) =>
  render(
    <TestMonitorList
      rows={[row()]}
      onRun={vi.fn()}
      runningScenarioId={null}
      isLoading={false}
      isError={false}
      copy={copy}
      {...props}
    />,
  );

describe("TestMonitorList", () => {
  it("shows one parent row per endpoint with passed/total, calls/24h and P95", () => {
    renderList();

    expect(screen.getByText("/auth/login")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("120ms")).toBeInTheDocument();
    // children are collapsed until the row is opened
    expect(screen.queryByText("Sai mật khẩu")).not.toBeInTheDocument();
  });

  it("expands to the case rows on click and collapses again", () => {
    renderList();
    const parent = screen.getByText("/auth/login").closest("tr")!;

    fireEvent.click(parent);
    expect(screen.getByText("Request hợp lệ")).toBeInTheDocument();
    expect(screen.getByText("Sai mật khẩu")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Test/ })).toHaveLength(3);

    fireEvent.click(parent);
    expect(screen.queryByText("Sai mật khẩu")).not.toBeInTheDocument();
  });

  it("badges each case by its latest run: pass, fail, or never run", () => {
    renderList();
    fireEvent.click(screen.getByText("/auth/login").closest("tr")!);

    const caseRow = (name: string) => screen.getByText(name).closest("tr")!;
    expect(within(caseRow("Request hợp lệ")).getByText(copy.list.passBadge)).toBeInTheDocument();
    expect(within(caseRow("Sai mật khẩu")).getByText(copy.list.failBadge)).toBeInTheDocument();
    expect(within(caseRow("Thiếu email")).getByText(copy.list.neverRun)).toBeInTheDocument();
  });

  it("runs the clicked case only, without toggling the row", () => {
    const onRun = vi.fn();
    renderList({ onRun });
    fireEvent.click(screen.getByText("/auth/login").closest("tr")!);

    const target = screen.getByText("Thiếu email").closest("tr")!;
    fireEvent.click(within(target).getByRole("button", { name: /Test/ }));

    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onRun.mock.calls[0][0]).toMatchObject({ id: "s3" });
    expect(screen.getByText("Thiếu email")).toBeInTheDocument(); // still expanded
  });

  it("disables every Test button while one case is running", () => {
    renderList({ runningScenarioId: "s2" });
    fireEvent.click(screen.getByText("/auth/login").closest("tr")!);

    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    expect(screen.getByText(copy.list.running)).toBeInTheDocument();
  });

  it("marks endpoints with no scenarios and does not expand them", () => {
    renderList({ rows: [row({ cases: [], casesTotal: 0, casesPassed: 0, service: null })] });

    expect(screen.getByText(new RegExp(copy.list.noCases))).toBeInTheDocument();
    fireEvent.click(screen.getByText("/auth/login").closest("tr")!);
    expect(screen.queryByRole("button", { name: /Test/ })).not.toBeInTheDocument();
  });

  it("renders loading, error and empty states", () => {
    const { rerender } = renderList({ rows: [], isLoading: true });
    expect(screen.getByText(copy.list.loading)).toBeInTheDocument();

    rerender(<TestMonitorList rows={[]} onRun={vi.fn()} runningScenarioId={null} isLoading={false} isError copy={copy} />);
    expect(screen.getByText(copy.list.error)).toBeInTheDocument();

    rerender(<TestMonitorList rows={[]} onRun={vi.fn()} runningScenarioId={null} isLoading={false} isError={false} copy={copy} />);
    expect(screen.getByText(copy.list.empty)).toBeInTheDocument();
  });
});
