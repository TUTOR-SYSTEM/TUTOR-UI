"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, History } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { Dialog } from "@/components/ui/dialog-form.ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.ui";
import {
  STATUS_TONE_STYLE,
  durationTone,
  formatDateTime,
  formatDuration,
  prettyBody,
} from "@/components/logger/logger-utils";
import { cn } from "@/lib/utils";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type { ApiTestRun, ApiTestScenario } from "@/types";

const COLUMN_COUNT = 5;
const HEAD_CLASS = "px-3 text-[11px] font-bold uppercase tracking-wide text-[#9AAEA9]";

/** Lịch sử chạy của 1 case (mới nhất trước): status nhận được, đạt/lỗi, thời lượng; mở 1 lần chạy
 * để xem response body (đã che secret) hoặc lỗi kết nối, và mở trace của đúng lần đó. */
export function TestScenarioHistoryDialog({
  scenario,
  runs,
  isLoading,
  isError,
  onClose,
  onOpenTrace,
  copy,
}: {
  scenario: ApiTestScenario | null;
  runs: ApiTestRun[];
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
  onOpenTrace: (scenario: ApiTestScenario, correlationId: string) => void;
  copy: TestMonitorDictionary;
}) {
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  if (!scenario) return null;
  const t = copy.history;

  return (
    <Dialog
      isOpen
      icon={History}
      title={t.title(scenario.name)}
      subtitle={t.subtitle(scenario.method, scenario.path, scenario.expectedStatus)}
      className="w-[820px]"
      cancelText={t.close}
      onCancel={onClose}
      submitText={t.close}
      onSubmit={onClose}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={cn(HEAD_CLASS, "w-8")} />
            <TableHead className={HEAD_CLASS}>{t.columns.time}</TableHead>
            <TableHead className={HEAD_CLASS}>{t.columns.result}</TableHead>
            <TableHead className={cn(HEAD_CLASS, "text-right")}>{t.columns.status}</TableHead>
            <TableHead className={cn(HEAD_CLASS, "text-right")}>{t.columns.duration}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isError && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-[#C2412B]">
                {t.error}
              </TableCell>
            </TableRow>
          )}
          {!isError && isLoading && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-muted-foreground">
                {t.loading}
              </TableCell>
            </TableRow>
          )}
          {!isError && !isLoading && runs.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-muted-foreground">
                {t.empty}
              </TableCell>
            </TableRow>
          )}

          {!isError &&
            !isLoading &&
            runs.map((run) => {
              const open = openRunId === run.id;
              const at = formatDateTime(run.createdAt);
              const tone = STATUS_TONE_STYLE[run.passed ? "ok" : "err"];
              const slow = durationTone(run.durationMs);
              const Chevron = open ? ChevronDown : ChevronRight;
              return (
                <Fragment key={run.id}>
                  <TableRow
                    onClick={() => setOpenRunId(open ? null : run.id)}
                    aria-expanded={open}
                    className={cn("cursor-pointer hover:bg-[#F1FBF9]", open && "bg-[#F4FAF8]")}
                  >
                    <TableCell className="px-3">
                      <Chevron className="size-4 text-[#9AAEA9]" />
                    </TableCell>
                    <TableCell className="px-3 font-mono text-xs text-[#5C726D]">
                      {at.date} {at.time}
                    </TableCell>
                    <TableCell className="px-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-bold"
                        style={{ background: tone.bg, color: tone.text }}
                      >
                        {run.passed ? t.passed : t.failed}
                      </span>
                    </TableCell>
                    <TableCell
                      className="px-3 text-right font-mono text-sm font-bold"
                      style={{ color: tone.text }}
                    >
                      {run.actualStatus ?? t.noResponse}
                    </TableCell>
                    <TableCell
                      className="px-3 text-right font-mono text-sm"
                      style={{ color: slow ? STATUS_TONE_STYLE[slow].text : undefined }}
                    >
                      {formatDuration(run.durationMs)}
                    </TableCell>
                  </TableRow>
                  {open && (
                    <TableRow className="bg-[#FAFCFB] hover:bg-[#FAFCFB]">
                      <TableCell colSpan={COLUMN_COUNT} className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-[#16302b]">
                              {run.errorMessage && run.actualStatus === null
                                ? t.errorMessage
                                : t.responseBody}
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => onOpenTrace(scenario, run.correlationId)}
                              className="h-7! w-auto! px-2.5! text-xs"
                            >
                              {t.viewTrace}
                            </Button>
                          </div>
                          {run.requestPath && (
                            <p className="font-mono text-xs text-[#5C726D]">
                              {t.requestPath}: {scenario.method} {run.requestPath}
                            </p>
                          )}
                          <pre className="max-h-64 overflow-auto rounded-md bg-[#0F1F1C] p-3 font-mono text-xs whitespace-pre-wrap break-all text-[#D7F5EE]">
                            {run.errorMessage && run.actualStatus === null
                              ? run.errorMessage
                              : run.responseBody
                                ? prettyBody(run.responseBody)
                                : t.noBody}
                          </pre>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
        </TableBody>
      </Table>
    </Dialog>
  );
}
