"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { RequestDetailDialog } from "@/components/logger/request-detail-dialog";
import UsageGuides from "@/components/ui/usage-guide.ui";
import { useTestMonitorCopy } from "@/hooks/useTestMonitorCopy.hook";
import { useTestMonitorTrace } from "@/hooks/useTestMonitorTrace.hook";
import { getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useLogActions } from "@/lib/services/log.service";
import { useTestScenarioActions } from "@/lib/services/test-scenario.service";
import { TestMonitorFilters } from "./test-monitor-filters";
import { TestMonitorHeader } from "./test-monitor-header";
import { TestMonitorList } from "./test-monitor-list";
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
  const traceView = useTestMonitorTrace();

  const [service, setService] = useState<string | null>(null);
  const [result, setResult] = useState<TestMonitorResultFilter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<TestMonitorRunAllProgress | null>(null);

  const { list, stats, run } = useTestScenarioActions({ list: true, stats: true });
  const { stats: logStats } = useLogActions({ stats: true });

  const scenarios = useMemo(() => list.data ?? [], [list.data]);
  const allRows = useMemo(
    () => buildEndpointRows(scenarios, stats.data ?? [], logStats.data ?? []),
    [scenarios, stats.data, logStats.data],
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

  const runScenario = (scenario: ApiTestScenario) => {
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
        const raw = await run.mutateAsync(scenario.id);
        if (unwrapApiData<ApiTestRun>(raw).passed) passed += 1;
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
        disabled={scenarios.length === 0 || run.isPending}
        onRunAll={() => void runMany(scenarios)}
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
          runningScenarioId={run.isPending && progress === null ? (run.variables ?? null) : null}
          busy={progress !== null}
          isLoading={list.isLoading}
          isError={list.isError}
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
