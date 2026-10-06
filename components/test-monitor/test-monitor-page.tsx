"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { RequestDetailDialog } from "@/components/logger/request-detail-dialog";
import UsageGuides from "@/components/ui/usage-guide.ui";
import { useTestMonitorCopy } from "@/hooks/useTestMonitorCopy.hook";
import { useTestMonitorMock } from "@/hooks/useTestMonitorMock.hook";
import { useTestMonitorTrace } from "@/hooks/useTestMonitorTrace.hook";
import { getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useLogActions } from "@/lib/services/log.service";
import { useTestScenarioActions } from "@/lib/services/test-scenario.service";
import { TestMonitorFilters } from "./test-monitor-filters";
import { TestMonitorHeader } from "./test-monitor-header";
import { TestMonitorList } from "./test-monitor-list";
import {
  MOCK_LOG_STATS,
  MOCK_SCENARIOS,
  buildMockScenarioStats,
  mockRunScenario,
} from "./test-monitor-mock-data";
import {
  buildEndpointRows,
  latestRunAt,
  matchesResult,
  matchesSearch,
} from "./test-monitor-utils";
import type {
  ApiTestRun,
  ApiTestScenario,
  TestMonitorEndpointRow,
  TestMonitorResultFilter,
  TestMonitorRunAllProgress,
} from "@/types";

export function TestMonitorPage() {
  const copy = useTestMonitorCopy();
  const mock = useTestMonitorMock();
  const traceView = useTestMonitorTrace(mock);

  const [service, setService] = useState<string | null>(null);
  const [result, setResult] = useState<TestMonitorResultFilter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<TestMonitorRunAllProgress | null>(null);

  // Demo mode (`?mock=1`): hooks stay mounted but disabled, and the page reads/updates local mock
  // state instead — nothing here ever reaches the real API.
  const [mockScenarios, setMockScenarios] = useState<ApiTestScenario[]>(MOCK_SCENARIOS);
  const [mockRunningId, setMockRunningId] = useState<string | null>(null);

  const { list, stats, run } = useTestScenarioActions({
    list: true,
    stats: true,
    listOptions: { enabled: !mock },
    statsOptions: { enabled: !mock },
  });
  const { stats: logStats } = useLogActions({ stats: true, statsOptions: { enabled: !mock } });

  const scenarios = useMemo(
    () => (mock ? mockScenarios : (list.data ?? [])),
    [mock, mockScenarios, list.data],
  );
  const allRows = useMemo(
    () =>
      mock
        ? buildEndpointRows(mockScenarios, buildMockScenarioStats(mockScenarios), MOCK_LOG_STATS)
        : buildEndpointRows(scenarios, stats.data ?? [], logStats.data ?? []),
    [mock, mockScenarios, scenarios, stats.data, logStats.data],
  );

  const services = useMemo(
    () => [...new Set(allRows.map((r) => r.service).filter((s): s is string => !!s))].sort(),
    [allRows],
  );

  // Tab counts respect the service chip and the search box, so a tab's number is what you'd get
  // by clicking it.
  const inScope = allRows.filter(
    (r) => (service === null || r.service === service) && matchesSearch(r, search),
  );
  const rows = inScope.filter((r) => matchesResult(r, result));
  const resultCounts: Record<TestMonitorResultFilter, number> = {
    all: inScope.length,
    err: inScope.filter((r) => matchesResult(r, "err")).length,
    slow: inScope.filter((r) => matchesResult(r, "slow")).length,
    ok: inScope.filter((r) => matchesResult(r, "ok")).length,
  };

  const expandableKeys = rows.filter((r) => r.cases.length > 0).map((r) => r.key);
  const allExpanded = expandableKeys.length > 0 && expandableKeys.every((k) => expanded.has(k));
  const toggleExpandAll = () => setExpanded(allExpanded ? new Set() : new Set(expandableKeys));
  const toggleRow = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const runMock = useCallback(async (scenario: ApiTestScenario): Promise<ApiTestRun> => {
    const testRun = await mockRunScenario(scenario.id);
    setMockScenarios((prev) =>
      prev.map((s) =>
        s.id === scenario.id
          ? {
              ...s,
              lastRun: {
                correlationId: testRun.correlationId,
                actualStatus: testRun.actualStatus,
                passed: testRun.passed,
                durationMs: testRun.durationMs,
                runAt: testRun.createdAt,
              },
            }
          : s,
      ),
    );
    return testRun;
  }, []);

  const runScenario = (scenario: ApiTestScenario) => {
    if (mock) {
      setMockRunningId(scenario.id);
      runMock(scenario)
        .then((testRun) => {
          if (testRun.passed) toast.success(copy.list.runPassed(scenario.name));
          else
            toast.error(
              copy.list.runFailed(scenario.name, testRun.expectedStatus, testRun.actualStatus),
            );
        })
        .catch((err) => toast.error(getErrorMessage(err, copy.list.runError)))
        .finally(() => setMockRunningId(null));
      return;
    }
    run.mutate(scenario.id, {
      onSuccess: (raw) => {
        const testRun = unwrapApiData<ApiTestRun>(raw);
        if (testRun.passed) toast.success(copy.list.runPassed(scenario.name));
        else
          toast.error(
            copy.list.runFailed(scenario.name, testRun.expectedStatus, testRun.actualStatus),
          );
      },
      onError: (err) => toast.error(getErrorMessage(err, copy.list.runError)),
    });
  };

  // Runs the cases one after another (never in parallel — they hit the live gateway) and reports
  // a single summary toast.
  const runMany = async (targets: ApiTestScenario[]) => {
    if (targets.length === 0 || progress !== null) return;
    let passed = 0;
    setProgress({ done: 0, total: targets.length });
    try {
      for (const [index, scenario] of targets.entries()) {
        const testRun = mock
          ? await runMock(scenario)
          : unwrapApiData<ApiTestRun>(await run.mutateAsync(scenario.id));
        if (testRun.passed) passed += 1;
        setProgress({ done: index + 1, total: targets.length });
      }
      toast.success(copy.page.runAllDone(passed, targets.length));
    } catch (err) {
      toast.error(getErrorMessage(err, copy.page.runAllError));
    } finally {
      setProgress(null);
    }
  };

  const runEndpoint = (row: TestMonitorEndpointRow) => void runMany(row.cases);

  return (
    <div className="flex flex-col gap-5">
      <TestMonitorHeader
        endpointCount={allRows.length}
        caseCount={scenarios.length}
        lastRunAt={latestRunAt(scenarios)}
        progress={progress}
        disabled={scenarios.length === 0 || run.isPending || mockRunningId !== null}
        onRunAll={() => void runMany(scenarios)}
        demo={mock}
        copy={copy}
      />

      <div className="overflow-hidden rounded-2xl border border-[#E7EEEC] bg-white shadow-sm">
        <TestMonitorFilters
          endpointCount={inScope.length}
          services={services}
          service={service}
          onServiceChange={setService}
          resultCounts={resultCounts}
          result={result}
          onResultChange={setResult}
          allExpanded={allExpanded}
          onToggleExpandAll={toggleExpandAll}
          search={search}
          onSearchChange={setSearch}
          copy={copy}
        />

        <TestMonitorList
          rows={rows}
          expanded={expanded}
          onToggle={toggleRow}
          onRun={runScenario}
          onRunEndpoint={runEndpoint}
          onOpenTrace={traceView.open}
          runningScenarioId={
            mock
              ? mockRunningId
              : run.isPending && progress === null
                ? (run.variables ?? null)
                : null
          }
          busy={progress !== null || mockRunningId !== null}
          isLoading={!mock && list.isLoading}
          isError={!mock && list.isError}
          copy={copy}
        />
      </div>

      <RequestDetailDialog
        variant="services"
        filteredRequests={[]}
        selectedCorrelationId={traceView.selected?.correlationId ?? null}
        onSelectCorrelationId={() => {}}
        onClose={traceView.close}
        spanIdx={traceView.spanIdx}
        onSpanIdxChange={traceView.setSpanIdx}
        trace={traceView.trace}
        isTraceLoading={traceView.isTraceLoading}
        realtime={traceView.realtime}
        copy={traceView.loggerCopy}
      />

      <UsageGuides steps={copy.usageGuide.steps} warning={copy.usageGuide.warning} />
    </div>
  );
}
