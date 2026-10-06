"use client";

import { Fragment } from "react";
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
import { durationTone, formatDuration } from "@/components/logger/logger-utils";
import { cn } from "@/lib/utils";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type { ApiTestScenario, TestMonitorEndpointRow } from "@/types";
import { MethodTag, ResultPill, ServiceFlow, ServiceTag } from "./test-monitor-badges";
import { TestMonitorCaseRow } from "./test-monitor-case-row";
import { formatCompact, resultOf } from "./test-monitor-utils";

const COLUMN_COUNT = 8;
const HEAD_CLASS = "px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-[#9AAEA9]";

function CasesProgress({ passed, total }: { passed: number; total: number }) {
  if (total === 0) return <span className="text-sm text-[#8AA09B]">—</span>;
  return (
    <span
      className={cn(
        "font-mono text-sm font-bold",
        passed === total ? "text-[#0B7A6D]" : passed === 0 ? "text-[#C2412B]" : "text-[#B45309]",
      )}
    >
      {passed}/{total}
    </span>
  );
}

export function TestMonitorList({
  rows,
  expanded,
  onToggle,
  onRun,
  onRunEndpoint,
  onOpenTrace,
  runningScenarioId,
  busy = false,
  isLoading,
  isError,
  copy,
}: {
  rows: TestMonitorEndpointRow[];
  /** Các `row.key` đang mở. */
  expanded: ReadonlySet<string>;
  onToggle: (key: string) => void;
  onRun: (scenario: ApiTestScenario) => void;
  /** Chạy tuần tự mọi case của 1 endpoint (nút Test ở hàng cha). */
  onRunEndpoint: (row: TestMonitorEndpointRow) => void;
  onOpenTrace: (scenario: ApiTestScenario) => void;
  /** Kịch bản đang chạy — khoá các nút Test khác để không bắn chồng request. */
  runningScenarioId: string | null;
  /** Đang chạy hàng loạt (Test toàn bộ / Test endpoint) — khoá mọi nút Test. */
  busy?: boolean;
  isLoading: boolean;
  isError: boolean;
  copy: TestMonitorDictionary;
}) {
  const locked = busy || runningScenarioId !== null;

  return (
    <div className="max-h-[720px] overflow-y-auto border-t border-[#E7EEEC]">
      <Table>
        <TableHeader>
          <TableRow className="sticky top-0 z-10 border-b border-[#E7EEEC] bg-[#F7FAF9]">
            <TableHead className={cn(HEAD_CLASS, "pl-10 text-left")}>{copy.list.columns.result}</TableHead>
            <TableHead className={cn(HEAD_CLASS, "text-left")}>{copy.list.columns.method}</TableHead>
            <TableHead className={cn(HEAD_CLASS, "text-left")}>{copy.list.columns.endpoint}</TableHead>
            <TableHead className={cn(HEAD_CLASS, "text-left")}>{copy.list.columns.flow}</TableHead>
            <TableHead className={cn(HEAD_CLASS, "text-right")}>{copy.list.columns.casesPassed}</TableHead>
            <TableHead className={cn(HEAD_CLASS, "text-right")}>{copy.list.columns.calls24h}</TableHead>
            <TableHead className={cn(HEAD_CLASS, "text-right")}>{copy.list.columns.p95}</TableHead>
            <TableHead className={cn(HEAD_CLASS, "text-right")}>
              <span className="sr-only">{copy.list.columns.action}</span>
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
              const result = resultOf(row);
              const Chevron = open ? ChevronDown : ChevronRight;
              return (
                <Fragment key={row.key}>
                  <TableRow
                    onClick={expandable ? () => onToggle(row.key) : undefined}
                    className={cn(
                      "border-b border-[#EEF3F1]",
                      expandable && "cursor-pointer hover:bg-[#F1FBF9]",
                      open && "bg-[#F4FAF8]",
                    )}
                  >
                    <TableCell className="py-3 pr-3 pl-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={!expandable}
                          aria-expanded={expandable ? open : undefined}
                          aria-label={copy.list.expandRow(row.path)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggle(row.key);
                          }}
                        >
                          <Chevron className="size-4 text-[#9AAEA9]" />
                        </Button>
                        <ResultPill result={result} label={copy.list.result[result]} />
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <MethodTag method={row.method} />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <p className="truncate font-mono text-sm font-semibold text-[#16302b]">{row.path}</p>
                      <p className="mt-0.5 truncate text-xs text-[#8AA09B]">
                        {expandable ? copy.list.caseCount(row.cases.length) : copy.list.noCases}
                      </p>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      {row.flowServices.length > 0 ? (
                        <ServiceFlow services={row.flowServices} />
                      ) : row.service ? (
                        <ServiceTag service={row.service} />
                      ) : (
                        <span className="text-sm text-[#8AA09B]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      <CasesProgress passed={row.casesPassed} total={row.casesTotal} />
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right font-mono text-sm text-[#5C726D]">
                      {formatCompact(row.calls24h)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-3 py-3 text-right font-mono text-sm font-medium",
                        p95Tone === "err"
                          ? "text-[#C2412B]"
                          : p95Tone === "warn"
                            ? "text-[#B45309]"
                            : "text-[#16302b]",
                      )}
                    >
                      {row.calls24h > 0 ? formatDuration(row.p95Ms) : "—"}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      {expandable && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={locked}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRunEndpoint(row);
                          }}
                          className="h-8! w-auto! gap-1.5 bg-[#0E9F8E]! px-3! hover:bg-[#0B8A7B]!"
                        >
                          <Play className="size-3" />
                          {copy.list.testButton}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>

                  {open &&
                    row.cases.map((scenario) => (
                      <TestMonitorCaseRow
                        key={scenario.id}
                        scenario={scenario}
                        running={runningScenarioId === scenario.id}
                        disabled={locked}
                        onRun={onRun}
                        onOpenTrace={onOpenTrace}
                        copy={copy}
                      />
                    ))}
                </Fragment>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
