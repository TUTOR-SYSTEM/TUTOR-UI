"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input.ui";
import { Pagination } from "@/components/ui/pagination.ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.ui";
import { cn } from "@/lib/utils";
import {
  categoryOf,
  durationTone,
  formatDateTime,
  formatDuration,
  methodColorOf,
} from "./logger-utils";
import type { LoggerDictionary } from "@/lib/i18n/logger.dictionary";
import type { ApiRequestLog, LoggerRequestFilter } from "@/types";

const FILTER_KEYS: LoggerRequestFilter[] = ["all", "err", "warn", "slow", "ok"];
const TABLE_COLUMN_COUNT = 5;

const RESULT_TONE_STYLE: Record<"ok" | "warn" | "slow", { bg: string; text: string; dot: string }> = {
  ok: { bg: "#E4F6EF", text: "#0B7A6D", dot: "#0B7A6D" },
  warn: { bg: "#FEE9E4", text: "#C2412B", dot: "#C2412B" },
  slow: { bg: "#FEF3C7", text: "#B45309", dot: "#B45309" },
};

function resultToneOf(row: ApiRequestLog): "ok" | "warn" | "slow" {
  const cat = categoryOf(row);
  if (cat === "err" || cat === "warn") return "warn";
  if (cat === "slow") return "slow";
  return "ok";
}

function ResultPill({ tone, label }: { tone: "ok" | "warn" | "slow"; label: string }) {
  return (
    <span
      className="flex w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: RESULT_TONE_STYLE[tone].bg, color: RESULT_TONE_STYLE[tone].text }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: RESULT_TONE_STYLE[tone].dot }} />
      {label}
    </span>
  );
}

function DurationText({ ms }: { ms: number }) {
  const tone = durationTone(ms);
  return (
    <span
      className={cn(
        "font-mono text-sm font-medium",
        tone === "err" ? "text-[#C2412B]" : tone === "warn" ? "text-[#B45309]" : "text-[#16302b]",
      )}
    >
      {formatDuration(ms)}
    </span>
  );
}

export function LoggerRequestList({
  requests,
  total,
  page,
  totalPages,
  onPageChange,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  selectedCorrelationId,
  onSelectRequest,
  isLoading,
  isError,
  copy,
}: {
  requests: ApiRequestLog[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filter: LoggerRequestFilter;
  onFilterChange: (filter: LoggerRequestFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  selectedCorrelationId: string | null;
  onSelectRequest: (correlationId: string) => void;
  isLoading: boolean;
  isError: boolean;
  copy: LoggerDictionary;
}) {
  const filtered = requests.filter((r) => filter === "all" || categoryOf(r) === filter);

  const counts: Record<LoggerRequestFilter, number> = {
    all: requests.length,
    err: requests.filter((r) => categoryOf(r) === "err").length,
    warn: requests.filter((r) => categoryOf(r) === "warn").length,
    slow: requests.filter((r) => categoryOf(r) === "slow").length,
    ok: requests.filter((r) => categoryOf(r) === "ok").length,
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E7EEEC] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[#16302b]">{copy.list.title(total)}</h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9AAEA9]" />
            <Input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={copy.list.searchPlaceholder}
              className="h-9! w-56 rounded-lg border-[#E7EEEC] bg-white pl-9 pr-3 text-sm text-[#16302b] placeholder:text-[#9AAEA9] focus-visible:border-[#0E9F8E] focus-visible:ring-2 focus-visible:ring-[#0E9F8E]/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_KEYS.map((key) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onFilterChange(key)}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
                    active
                      ? "bg-[#0E9F8E] text-white"
                      : "bg-[#F3F7F5] text-[#5C726D] hover:bg-[#E7EEEC]",
                  )}
                >
                  {copy.list.filters[key]}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[10px] font-bold",
                      active ? "bg-white/25" : "bg-white text-[#8AA09B]",
                    )}
                  >
                    {counts[key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-h-[640px] overflow-y-auto rounded-xl border border-[#E7EEEC]">
        <Table>
          <TableHeader>
            <TableRow className="sticky top-0 z-10 border-b border-[#E7EEEC] bg-[#F3F7F5]">
              <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                {copy.list.columns.result}
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                {copy.list.columns.method}
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                {copy.list.columns.endpoint}
              </TableHead>
              <TableHead className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
                {copy.list.columns.duration}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isError && (
              <TableRow>
                <TableCell colSpan={TABLE_COLUMN_COUNT} className="py-14 text-center text-[#C2412B]">
                  {copy.list.error}
                </TableCell>
              </TableRow>
            )}

            {!isError && isLoading && (
              <TableRow>
                <TableCell colSpan={TABLE_COLUMN_COUNT} className="py-14 text-center text-muted-foreground">
                  {copy.list.loading}
                </TableCell>
              </TableRow>
            )}

            {!isError && !isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={TABLE_COLUMN_COUNT} className="py-14 text-center text-muted-foreground">
                  {copy.list.empty}
                </TableCell>
              </TableRow>
            )}

            {!isError &&
              !isLoading &&
              filtered.map((req) => {
                const selected = req.correlationId === selectedCorrelationId;
                const resultTone = resultToneOf(req);
                const { date, time } = formatDateTime(req.createdAt);
                const methodColor = methodColorOf(req.method);

                return (
                  <TableRow
                    key={req.id}
                    onClick={() => onSelectRequest(req.correlationId)}
                    className={cn(
                      "cursor-pointer border-b border-[#EEF3F1] last:border-0 hover:bg-[#F1FBF9]",
                      selected && "border-l-2 border-l-[#0E9F8E] bg-[#EAF6F2]",
                    )}
                  >
                    <TableCell className="px-4 py-3.5">
                      <ResultPill tone={resultTone} label={copy.list.resultBadge[categoryOf(req)]} />
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <span
                        className="w-max rounded-md px-2 py-0.5 font-mono text-xs font-semibold"
                        style={{ background: methodColor.bg, color: methodColor.text }}
                      >
                        {req.method ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <p className="truncate font-mono text-sm font-medium text-[#16302b]">{req.path}</p>
                      <p className="mt-0.5 truncate text-xs text-[#8AA09B]">
                        {copy.list.subline(`${date} ${time}`, req.ip ?? "—")}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right">
                      <DurationText ms={req.durationMs} />
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />}
    </div>
  );
}
