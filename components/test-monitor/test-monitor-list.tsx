"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Play } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.ui";
import { durationTone, formatDuration, methodColorOf } from "@/components/logger/logger-utils";
import { cn } from "@/lib/utils";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type { ApiTestScenario, TestMonitorEndpointRow } from "@/types";

const COLUMN_COUNT = 5;
const HEAD_CLASS = "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]";

function MethodTag({ method }: { method: string }) {
  const color = methodColorOf(method);
  return (
    <span
      className="w-max rounded-md px-2 py-0.5 font-mono text-xs font-semibold"
      style={{ background: color.bg, color: color.text }}
    >
      {method}
    </span>
  );
}

function CasesProgress({ passed, total }: { passed: number; total: number }) {
  if (total === 0) return <span className="text-sm text-[#8AA09B]">—</span>;
  const allPassed = passed === total;
  return (
    <span
      className={cn(
        "font-mono text-sm font-semibold",
        allPassed ? "text-[#0B7A6D]" : passed === 0 ? "text-[#C2412B]" : "text-[#B45309]",
      )}
    >
      {passed}/{total}
    </span>
  );
}

function CaseRow({
  scenario,
  running,
  disabled,
  onRun,
  copy,
}: {
  scenario: ApiTestScenario;
  running: boolean;
  disabled: boolean;
  onRun: (scenario: ApiTestScenario) => void;
  copy: TestMonitorDictionary;
}) {
  const last = scenario.lastRun;
  return (
    <TableRow className="border-b border-[#EEF3F1] bg-[#FAFCFB] last:border-0">
      <TableCell className="py-3 pl-12 pr-4">
        <p className="truncate text-sm font-medium text-[#16302b]">{scenario.name}</p>
        <p className="mt-0.5 truncate text-xs text-[#8AA09B]">
          {copy.list.category[scenario.category]} ·{" "}
          {copy.list.expectedStatus(scenario.expectedStatus)}
        </p>
      </TableCell>
      <TableCell className="px-4 py-3">
        {last ? (
          <span
            className={cn(
              "w-max rounded-full px-2.5 py-1 text-xs font-semibold",
              last.passed ? "bg-[#E4F6EF] text-[#0B7A6D]" : "bg-[#FEE9E4] text-[#C2412B]",
            )}
          >
            {last.passed ? copy.list.passBadge : copy.list.failBadge}
          </span>
        ) : (
          <span className="text-xs text-[#8AA09B]">{copy.list.neverRun}</span>
        )}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-xs text-[#5C726D]">
        {last ? copy.list.actualStatus(last.actualStatus) : "—"}
      </TableCell>
      <TableCell className="px-4 py-3 text-right font-mono text-sm text-[#16302b]">
        {last ? formatDuration(last.durationMs) : "—"}
      </TableCell>
      <TableCell className="px-4 py-3 text-right">
        <Button
          type="button"
          size="sm"
          variant="outline"
          loading={running}
          disabled={disabled}
          onClick={() => onRun(scenario)}
          className="h-8! w-auto! gap-1.5 px-3!"
        >
          {!running && <Play className="size-3" />}
          {running ? copy.list.running : copy.list.testButton}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function TestMonitorList({
  rows,
  onRun,
  runningScenarioId,
  isLoading,
  isError,
  copy,
}: {
  rows: TestMonitorEndpointRow[];
  onRun: (scenario: ApiTestScenario) => void;
  /** Kịch bản đang chạy — khoá các nút Test khác để không bắn chồng request. */
  runningScenarioId: string | null;
  isLoading: boolean;
  isError: boolean;
  copy: TestMonitorDictionary;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E7EEEC] bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-[#16302b]">{copy.list.title(rows.length)}</h2>

      <div className="max-h-[720px] overflow-y-auto rounded-xl border border-[#E7EEEC]">
        <Table>
          <TableHeader>
            <TableRow className="sticky top-0 z-10 border-b border-[#E7EEEC] bg-[#F3F7F5]">
              <TableHead className={cn(HEAD_CLASS, "text-left")}>
                {copy.list.columns.endpoint}
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "text-left")}>
                {copy.list.columns.casesPassed}
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "text-right")}>
                {copy.list.columns.calls24h}
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "text-right")}>{copy.list.columns.p95}</TableHead>
              <TableHead className={cn(HEAD_CLASS, "text-right")}>
                {copy.list.columns.action}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isError && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-14 text-center text-[#C2412B]">
                  {copy.list.error}
                </TableCell>
              </TableRow>
            )}
            {!isError && isLoading && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-14 text-center text-muted-foreground">
                  {copy.list.loading}
                </TableCell>
              </TableRow>
            )}
            {!isError && !isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-14 text-center text-muted-foreground">
                  {copy.list.empty}
                </TableCell>
              </TableRow>
            )}

            {!isError &&
              !isLoading &&
              rows.map((row) => {
                const open = expanded.has(row.key);
                const p95Tone = durationTone(row.p95Ms);
                const expandable = row.cases.length > 0;
                return (
                  <Fragment key={row.key}>
                    <TableRow
                      onClick={expandable ? () => toggle(row.key) : undefined}
                      className={cn(
                        "border-b border-[#EEF3F1] last:border-0",
                        expandable && "cursor-pointer hover:bg-[#F1FBF9]",
                        open && "bg-[#EAF6F2]",
                      )}
                    >
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {open ? (
                            <ChevronDown className="size-4 shrink-0 text-[#9AAEA9]" />
                          ) : (
                            <ChevronRight
                              className={cn(
                                "size-4 shrink-0 text-[#9AAEA9]",
                                !expandable && "opacity-30",
                              )}
                            />
                          )}
                          <MethodTag method={row.method} />
                          <div className="min-w-0">
                            <p className="truncate font-mono text-sm font-medium text-[#16302b]">
                              {row.path}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-[#8AA09B]">
                              {expandable ? copy.list.caseCount(row.cases.length) : copy.list.noCases}
                              {row.service ? ` · ${row.service}` : ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <CasesProgress passed={row.casesPassed} total={row.casesTotal} />
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-[#16302b]">
                        {row.calls24h}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "px-4 py-3.5 text-right font-mono text-sm font-medium",
                          p95Tone === "err"
                            ? "text-[#C2412B]"
                            : p95Tone === "warn"
                              ? "text-[#B45309]"
                              : "text-[#16302b]",
                        )}
                      >
                        {row.calls24h > 0 ? formatDuration(row.p95Ms) : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3.5" />
                    </TableRow>

                    {open &&
                      row.cases.map((scenario) => (
                        <CaseRow
                          key={scenario.id}
                          scenario={scenario}
                          running={runningScenarioId === scenario.id}
                          disabled={runningScenarioId !== null}
                          onRun={onRun}
                          copy={copy}
                        />
                      ))}
                  </Fragment>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
