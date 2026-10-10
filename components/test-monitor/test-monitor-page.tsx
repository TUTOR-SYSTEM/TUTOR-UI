"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { RequestDetailDialog } from "@/components/logger/request-detail-dialog";
import { Button } from "@/components/ui/button.ui";
import UsageGuides from "@/components/ui/usage-guide.ui";
import { useTestMonitorCopy } from "@/hooks/useTestMonitorCopy.hook";
import { useTestMonitorMock } from "@/hooks/useTestMonitorMock.hook";
import { useTestFixtures } from "@/hooks/useTestFixtures.hook";
import { useTestMonitorTrace } from "@/hooks/useTestMonitorTrace.hook";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { useLogActions } from "@/lib/services/log.service";
import { useTestScenarioActions } from "@/lib/services/test-scenario.service";
import { TestMonitorFilters } from "./test-monitor-filters";
import { TestMonitorHeader } from "./test-monitor-header";
import { TestMonitorList } from "./test-monitor-list";
import { DeleteTestFixtureDialog } from "./delete-test-fixture-dialog";
import { GenerateTestScenariosDialog } from "./generate-test-scenarios-dialog";
import { TestCoverageMatrix } from "./test-coverage-matrix";
import { buildCoverageRows } from "./test-monitor-coverage";
import { DeleteTestScenarioDialog } from "./delete-test-scenario-dialog";
import { TestFixtureFormDialog } from "./test-fixture-form-dialog";
import { TestFixturesDialog } from "./test-fixtures-dialog";
import { emptyFixtureForm, fixtureToForm, suggestedFixtureForm } from "./test-fixture-form";
import { TestScenarioFormDialog } from "./test-scenario-form-dialog";
import { TestScenarioHistoryDialog } from "./test-scenario-history-dialog";
import { emptyScenarioForm, scenarioToForm } from "./test-scenario-form";
import {
  MOCK_LOG_STATS,
  MOCK_META,
  MOCK_ROUTES,
  MOCK_RUNS,
  MOCK_SCENARIOS,
  MOCK_TRACES,
  buildMockScenarioStats,
  flowFromTrace,
  mockGenerateScenarios,
  mockRunScenario,
} from "./test-monitor-mock-data";
import {
  buildEndpointRows,
  latestRunAt,
  matchesResult,
  matchesService,
  matchesSearch,
  servicesOfRow,
} from "./test-monitor-utils";
import type {
  ApiTestFixture,
  BulkCreateScenariosResult,
  GenerateDialogState,
  GenerateScenariosPayload,
  GenerateScenariosResult,
  TestMonitorTab,
  ApiTestRun,
  ApiTestScenario,
  CreateTestScenarioPayload,
  TestMonitorCaseAction,
  TestMonitorEndpointRow,
  TestMonitorResultFilter,
  TestMonitorRunAllProgress,
  TestFixtureEditorState,
  TestScenarioEditorState,
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

  // Case dialogs. `editorKey` remounts the form so each opening starts from its own initial values.
  const [editor, setEditor] = useState<TestScenarioEditorState | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<ApiTestScenario | null>(null);
  const [historyScenario, setHistoryScenario] = useState<ApiTestScenario | null>(null);

  // Fixtures dialog (+ its own form/delete dialogs stacked on top).
  const [fixturesOpen, setFixturesOpen] = useState(false);
  const [fixtureEditor, setFixtureEditor] = useState<TestFixtureEditorState | null>(null);
  const [fixtureEditorKey, setFixtureEditorKey] = useState(0);
  const [fixtureDeleteTarget, setFixtureDeleteTarget] = useState<ApiTestFixture | null>(null);
  // Generator dialog; its fixture hints need the fixture list too.
  const [generator, setGenerator] = useState<GenerateDialogState | null>(null);
  const [generatorKey, setGeneratorKey] = useState(0);
  const [tab, setTab] = useState<TestMonitorTab>("endpoints");
  const fixtureData = useTestFixtures({ mock, fixturesEnabled: fixturesOpen || generator !== null });
  const openFixtureEditor = (next: TestFixtureEditorState) => {
    setFixtureEditorKey((k) => k + 1);
    setFixtureEditor(next);
  };

  const actions = useTestScenarioActions({
    list: true,
    stats: true,
    routes: true,
    listOptions: { enabled: !mock },
    statsOptions: { enabled: !mock },
    routesOptions: { enabled: !mock },
    metaOptions: { enabled: !mock },
    runsScenarioId: historyScenario?.id,
    runsOptions: { enabled: !!historyScenario && !mock },
  });
  const { list, stats, routes, meta, run, runs } = actions;
  const environment = mock ? MOCK_META.environment : (meta.data?.environment ?? null);
  const { stats: logStats } = useLogActions({ stats: true, statsOptions: { enabled: !mock } });

  const scenarios = useMemo(
    () => (mock ? mockScenarios : (list.data ?? [])),
    [mock, mockScenarios, list.data],
  );
  const routeList = useMemo(() => (mock ? MOCK_ROUTES : (routes.data ?? [])), [mock, routes.data]);
  const allRows = useMemo(
    () =>
      mock
        ? buildEndpointRows(mockScenarios, buildMockScenarioStats(mockScenarios), MOCK_LOG_STATS, routeList)
        : buildEndpointRows(scenarios, stats.data ?? [], logStats.data ?? [], routeList),
    [mock, mockScenarios, scenarios, stats.data, logStats.data, routeList],
  );
  const coverageRows = useMemo(() => buildCoverageRows(routeList, scenarios), [routeList, scenarios]);

  const services = useMemo(
    () => [...new Set(allRows.flatMap(servicesOfRow))].sort(),
    [allRows],
  );

  // Tab counts respect the service chip and the search box, so a tab's number is what you'd get
  // by clicking it.
  const inScope = allRows.filter(
    (r) => matchesService(r, service) && matchesSearch(r, search),
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
    const testRun = await mockRunScenario(scenario.id, scenario);
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
              flow: flowFromTrace(MOCK_TRACES[testRun.correlationId] ?? []),
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

  const openEditor = (next: TestScenarioEditorState) => {
    setEditorKey((k) => k + 1);
    setEditor(next);
  };

  const addCase = (row?: TestMonitorEndpointRow) =>
    openEditor({
      mode: "create",
      initial: emptyScenarioForm(
        row
          ? {
              method: row.method,
              path: row.path,
              service: row.service ?? row.flowServices.at(-1),
            }
          : {},
      ),
    });

  const openGenerator = (
    routeScope: GenerateDialogState["routes"],
    categories: GenerateDialogState["categories"] = [],
  ) => {
    setGeneratorKey((k) => k + 1);
    setGenerator({ routes: routeScope, categories });
  };

  const previewGenerated = async (payload: GenerateScenariosPayload): Promise<GenerateScenariosResult> => {
    if (mock) return mockGenerateScenarios(payload, mockScenarios);
    try {
      return unwrapApiData<GenerateScenariosResult>(await actions.generate.mutateAsync(payload));
    } catch (err) {
      toast.error(getErrorMessage(err, copy.generator.previewError));
      throw err;
    }
  };

  const saveGenerated = async (chosen: CreateTestScenarioPayload[]) => {
    let outcome: BulkCreateScenariosResult;
    if (mock) {
      const now = new Date().toISOString();
      setMockScenarios((prev) => [
        ...prev,
        ...chosen.map((payload, i) => ({
          ...payload,
          id: `mock-gen-${Date.now()}-${i}`,
          description: payload.description ?? null,
          createdAt: now,
          updatedAt: null,
          lastRun: null,
          flow: [],
        })),
      ]);
      outcome = { created: chosen.length, skipped: 0 };
    } else {
      try {
        outcome = unwrapApiData<BulkCreateScenariosResult>(
          await actions.bulkCreate.mutateAsync({ scenarios: chosen }),
        );
      } catch (err) {
        toast.error(getErrorMessage(err, copy.generator.saveError));
        throw err;
      }
    }
    toast.success(copy.generator.saved(outcome.created, outcome.skipped));
  };

  const handleCaseAction = (action: TestMonitorCaseAction, scenario: ApiTestScenario) => {
    if (action === "edit") openEditor({ mode: "edit", scenarioId: scenario.id, initial: scenarioToForm(scenario) });
    else if (action === "duplicate") {
      const initial = scenarioToForm(scenario);
      openEditor({ mode: "create", initial: { ...initial, name: copy.editor.duplicateName(initial.name) } });
    } else if (action === "history") setHistoryScenario(scenario);
    else setDeleteTarget(scenario);
  };

  // Rejects after toasting so the dialog stays open with the user's input.
  const saveScenario = async (payload: CreateTestScenarioPayload, scenarioId?: string) => {
    if (mock) {
      const now = new Date().toISOString();
      setMockScenarios((prev) =>
        scenarioId
          ? prev.map((s) => (s.id === scenarioId ? { ...s, ...payload, updatedAt: now } : s))
          : [
              ...prev,
              {
                ...payload,
                id: `mock-new-${Date.now()}`,
                description: payload.description ?? null,
                createdAt: now,
                updatedAt: null,
                lastRun: null,
                flow: [],
              },
            ],
      );
    } else {
      try {
        if (scenarioId) await actions.update.mutateAsync({ id: scenarioId, ...payload });
        else await actions.create.mutateAsync(payload);
      } catch (err) {
        toast.error(getErrorMessage(err, copy.editor.saveError));
        throw err;
      }
    }
    toast.success(scenarioId ? copy.editor.saved(payload.name) : copy.editor.created(payload.name));
  };

  const deleteScenario = async (scenario: ApiTestScenario) => {
    if (mock) setMockScenarios((prev) => prev.filter((s) => s.id !== scenario.id));
    else {
      try {
        await actions.delete.mutateAsync(scenario.id);
      } catch (err) {
        toast.error(getErrorMessage(err, copy.deleteDialog.error));
        throw err;
      }
    }
    toast.success(copy.deleteDialog.deleted(scenario.name));
  };

  return (
    <div className="flex flex-col gap-5">
      <TestMonitorHeader
        endpointCount={allRows.length}
        caseCount={scenarios.length}
        lastRunAt={latestRunAt(scenarios)}
        progress={progress}
        disabled={scenarios.length === 0 || run.isPending || mockRunningId !== null}
        onRunAll={() => void runMany(scenarios)}
        onCreateCase={() => addCase()}
        onOpenFixtures={() => setFixturesOpen(true)}
        onGenerate={() => openGenerator(null)}
        environment={environment}
        demo={mock}
        copy={copy}
      />

      <div className="flex gap-1 self-start rounded-xl bg-[#EEF3F1] p-1" role="tablist">
        {(["endpoints", "coverage"] as const).map((key) => (
          <Button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            variant="ghost"
            size="sm"
            onClick={() => setTab(key)}
            className={cn(
              "h-8! w-auto! rounded-lg! px-4! text-sm font-semibold text-[#5C726D]",
              tab === key && "bg-white! text-[#16302b]! shadow-sm",
            )}
          >
            {copy.page.tabs[key]}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E7EEEC] bg-white shadow-sm">
        {tab === "coverage" ? (
          <TestCoverageMatrix
            rows={coverageRows}
            isLoading={!mock && (routes.isLoading || list.isLoading)}
            isError={!mock && routes.isError}
            onGenerate={openGenerator}
            copy={copy}
          />
        ) : (
        <>
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
          onCaseAction={handleCaseAction}
          onAddCase={addCase}
          onGenerate={(row) => openGenerator([{ method: row.method, path: row.path }])}
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
        </>
        )}
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

      <TestScenarioFormDialog
        key={editorKey}
        state={editor}
        routes={mock ? [] : (routes.data ?? [])}
        authProfiles={fixtureData.authProfiles}
        onClose={() => setEditor(null)}
        onSave={saveScenario}
        copy={copy}
      />

      <DeleteTestScenarioDialog
        scenario={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDelete={deleteScenario}
        copy={copy}
      />

      <TestScenarioHistoryDialog
        key={historyScenario?.id ?? "none"}
        scenario={historyScenario}
        runs={mock ? (MOCK_RUNS[historyScenario?.id ?? ""] ?? []) : (runs.data ?? [])}
        isLoading={!mock && runs.isLoading}
        isError={!mock && runs.isError}
        onClose={() => setHistoryScenario(null)}
        onOpenTrace={(scenario, correlationId) => {
          setHistoryScenario(null);
          traceView.open(scenario, correlationId);
        }}
        copy={copy}
      />

      <GenerateTestScenariosDialog
        key={`generator-${generatorKey}`}
        state={generator}
        existingFixtureKeys={fixtureData.fixtures.map((f) => f.key)}
        onClose={() => setGenerator(null)}
        onPreview={previewGenerated}
        onSave={saveGenerated}
        onCreateFixture={(key, suggestion) => openFixtureEditor({ initial: suggestedFixtureForm(key, suggestion) })}
        copy={copy}
      />

      <TestFixturesDialog
        open={fixturesOpen}
        fixtures={fixtureData.fixtures}
        authProfiles={fixtureData.authProfiles}
        isLoading={fixtureData.isLoading}
        isError={fixtureData.isError}
        resolvingId={fixtureData.resolvingId}
        onClose={() => setFixturesOpen(false)}
        onAdd={() => openFixtureEditor({ initial: emptyFixtureForm() })}
        onEdit={(fixture) => openFixtureEditor({ fixtureId: fixture.id, initial: fixtureToForm(fixture) })}
        onDelete={setFixtureDeleteTarget}
        onResolve={fixtureData.resolve}
        copy={copy}
      />

      <TestFixtureFormDialog
        key={`fixture-${fixtureEditorKey}`}
        state={fixtureEditor}
        onClose={() => setFixtureEditor(null)}
        onSave={fixtureData.save}
        copy={copy}
      />

      <DeleteTestFixtureDialog
        fixture={fixtureDeleteTarget}
        onClose={() => setFixtureDeleteTarget(null)}
        onDelete={fixtureData.remove}
        copy={copy}
      />

      <UsageGuides steps={copy.usageGuide.steps} warning={copy.usageGuide.warning} />
    </div>
  );
}
