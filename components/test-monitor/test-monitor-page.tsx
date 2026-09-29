"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import UsageGuides from "@/components/ui/usage-guide.ui";
import { useTestMonitorCopy } from "@/hooks/useTestMonitorCopy.hook";
import { getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useLogActions } from "@/lib/services/log.service";
import { useTestScenarioActions } from "@/lib/services/test-scenario.service";
import { TestMonitorFilters } from "./test-monitor-filters";
import { TestMonitorList } from "./test-monitor-list";
import { buildEndpointRows, matchesResult } from "./test-monitor-utils";
import type { ApiTestRun, ApiTestScenario, TestMonitorResultFilter } from "@/types";

export function TestMonitorPage() {
  const copy = useTestMonitorCopy();

  const [service, setService] = useState<string | null>(null);
  const [result, setResult] = useState<TestMonitorResultFilter>("all");

  const { list, stats, run } = useTestScenarioActions({ list: true, stats: true });
  const { stats: logStats } = useLogActions({ stats: true });

  const allRows = useMemo(
    () => buildEndpointRows(list.data ?? [], stats.data ?? [], logStats.data ?? []),
    [list.data, stats.data, logStats.data],
  );

  const services = useMemo(
    () => [...new Set(allRows.map((r) => r.service).filter((s): s is string => !!s))].sort(),
    [allRows],
  );

  // Result chip counts respect the service chip (and vice versa the service counts ignore the
  // result chip), so a chip's number is what you'd get by clicking it.
  const inService = allRows.filter((r) => service === null || r.service === service);
  const rows = inService.filter((r) => matchesResult(r, result));
  const resultCounts: Record<TestMonitorResultFilter, number> = {
    all: inService.length,
    err: inService.filter((r) => matchesResult(r, "err")).length,
    slow: inService.filter((r) => matchesResult(r, "slow")).length,
    ok: inService.filter((r) => matchesResult(r, "ok")).length,
  };
  const serviceCounts = Object.fromEntries(
    services.map((s) => [
      s,
      allRows.filter((r) => r.service === s && matchesResult(r, result)).length,
    ]),
  );

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

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-[#16302b]">{copy.page.title}</h1>
        <p className="mt-0.5 text-sm text-[#8AA09B]">{copy.page.subtitle}</p>
      </div>

      <TestMonitorFilters
        services={services}
        serviceCounts={serviceCounts}
        totalCount={allRows.filter((r) => matchesResult(r, result)).length}
        service={service}
        onServiceChange={setService}
        resultCounts={resultCounts}
        result={result}
        onResultChange={setResult}
        copy={copy}
      />

      <TestMonitorList
        rows={rows}
        onRun={runScenario}
        runningScenarioId={run.isPending ? (run.variables ?? null) : null}
        isLoading={list.isLoading}
        isError={list.isError}
        copy={copy}
      />

      <UsageGuides steps={copy.usageGuide.steps} warning={copy.usageGuide.warning} />
    </div>
  );
}
