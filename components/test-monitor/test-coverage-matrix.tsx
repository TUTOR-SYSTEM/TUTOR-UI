"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { Checkbox } from "@/components/ui/checkbox.ui";
import { Label } from "@/components/ui/label.ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.ui";
import { cn } from "@/lib/utils";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type { CoverageCellStatus, CoverageRow, TestScenarioCategory } from "@/types";
import { MethodTag } from "./test-monitor-badges";
import { missingCategories, summarizeCoverage } from "./test-monitor-coverage";
import { SCENARIO_CATEGORIES } from "./test-scenario-form";

const HEAD_CLASS = "px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-[#9AAEA9]";
const COLUMN_COUNT = SCENARIO_CATEGORIES.length + 3;

const CELL_STYLE: Record<CoverageCellStatus, string> = {
  pass: "bg-[#E4F6EF] text-[#0B7A6D]",
  fail: "bg-[#FDECEA] text-[#C2412B]",
  never: "bg-[#EEF2FF] text-[#4338CA]",
  missing: "border border-dashed border-[#F0B37E] bg-[#FFF7ED] text-[#B45309] hover:bg-[#FEEBD6]",
  na: "text-[#C5D3D0]",
};

/** Tab "Độ phủ": ma trận route × loại case. Ô "Thiếu" bấm được để sinh case đúng loại cho route
 * đó; nút ✨ cuối hàng sinh mọi loại còn thiếu. */
export function TestCoverageMatrix({
  rows,
  isLoading,
  isError,
  onGenerate,
  copy,
}: {
  rows: CoverageRow[];
  isLoading: boolean;
  isError: boolean;
  /** Mở bộ sinh case cho các route + loại case cho trước. */
  onGenerate: (routes: { method: string; path: string }[], categories: TestScenarioCategory[]) => void;
  copy: TestMonitorDictionary;
}) {
  const [onlyMissing, setOnlyMissing] = useState(false);
  const t = copy.coverage;
  const summary = summarizeCoverage(rows);
  const gaps = rows.filter((r) => missingCategories(r).length > 0);
  const visible = onlyMissing ? gaps : rows;
  const percent = summary.applicable ? (summary.covered / summary.applicable) * 100 : 0;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-64 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="text-base font-bold text-[#16302b]">{t.summary(summary.covered, summary.applicable)}</p>
            <p className="text-xs text-[#8AA09B]">{t.routesComplete(summary.routesComplete, summary.routesTotal)}</p>
            <p className="text-xs text-[#8AA09B]">{t.passing(summary.passing, summary.covered)}</p>
          </div>
          <div
            className="h-2 w-full max-w-md overflow-hidden rounded-full bg-[#EEF3F1]"
            role="progressbar"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-[#0E9F8E]" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="coverage-only-missing"
              checked={onlyMissing}
              onCheckedChange={(on) => setOnlyMissing(on === true)}
            />
            <Label htmlFor="coverage-only-missing" className="font-normal">
              {t.onlyMissing}
            </Label>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={gaps.length === 0}
            onClick={() =>
              onGenerate(
                gaps.map((r) => ({ method: r.method, path: r.path })),
                [...new Set(gaps.flatMap(missingCategories))],
              )
            }
            className="h-9! w-auto! gap-1.5 bg-[#0E9F8E]! px-3! hover:bg-[#0B8A7B]!"
          >
            <Sparkles className="size-3.5" />
            {t.generateAllMissing}
          </Button>
        </div>
      </div>

      <div className="max-h-[720px] overflow-y-auto border-t border-[#E7EEEC]">
        <Table>
          <TableHeader>
            <TableRow className="sticky top-0 z-10 border-b border-[#E7EEEC] bg-[#F7FAF9]">
              <TableHead className={HEAD_CLASS}>{t.columns.method}</TableHead>
              <TableHead className={HEAD_CLASS}>{t.columns.endpoint}</TableHead>
              {SCENARIO_CATEGORIES.map((category) => (
                <TableHead key={category} className={cn(HEAD_CLASS, "text-center")}>
                  {copy.list.category[category]}
                </TableHead>
              ))}
              <TableHead className={HEAD_CLASS}>
                <span className="sr-only">{t.columns.actions}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isError && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-14 text-center text-[#C2412B]">
                  {t.error}
                </TableCell>
              </TableRow>
            )}
            {!isError && isLoading && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-14 text-center text-muted-foreground">
                  {t.loading}
                </TableCell>
              </TableRow>
            )}
            {!isError && !isLoading && visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-14 text-center text-muted-foreground">
                  {t.empty}
                </TableCell>
              </TableRow>
            )}
            {!isError &&
              !isLoading &&
              visible.map((row) => {
                const missing = missingCategories(row);
                return (
                  <TableRow key={row.key} className="border-b border-[#EEF3F1]">
                    <TableCell className="px-3 py-2">
                      <MethodTag method={row.method} />
                    </TableCell>
                    <TableCell className="px-3 py-2 font-mono text-sm font-semibold text-[#16302b]">
                      {row.path}
                    </TableCell>
                    {SCENARIO_CATEGORIES.map((category) => {
                      const cell = row.cells[category];
                      const title = t.cellTitle(
                        copy.list.category[category],
                        t.status[cell.status],
                        cell.cases.length,
                      );
                      return (
                        <TableCell key={category} className="px-2 py-2 text-center">
                          {cell.status === "missing" ? (
                            <Button
                              type="button"
                              variant="ghost"
                              title={title}
                              aria-label={title}
                              onClick={() => onGenerate([{ method: row.method, path: row.path }], [category])}
                              className={cn("h-7! w-auto! min-w-16 rounded-md! px-2! text-xs font-bold", CELL_STYLE.missing)}
                            >
                              {t.status.missing}
                            </Button>
                          ) : (
                            <span
                              title={title}
                              className={cn(
                                "inline-flex h-7 min-w-16 items-center justify-center rounded-md px-2 text-xs font-bold",
                                CELL_STYLE[cell.status],
                              )}
                            >
                              {cell.status === "na" ? "—" : `${t.status[cell.status]} · ${cell.cases.length}`}
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="px-3 py-2 text-right">
                      {missing.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={t.generateMissingFor(row.path)}
                          title={t.generateMissingFor(row.path)}
                          onClick={() => onGenerate([{ method: row.method, path: row.path }], missing)}
                        >
                          <Sparkles className="size-4 text-[#0B7A6D]" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
