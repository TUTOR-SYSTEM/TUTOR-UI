"use client";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table.ui";
import { cn } from "@/lib/utils";
import { durationTone, formatDuration, methodColorOf } from "./logger-utils";
import type { LoggerDictionary } from "@/lib/i18n/logger.dictionary";
import type { EndpointStats } from "@/types";

export function EndpointStatsList({
  stats,
  isLoading,
  isError,
  copy,
}: {
  stats: EndpointStats[];
  isLoading: boolean;
  isError: boolean;
  copy: LoggerDictionary;
}) {
  const columns: DataTableColumn<EndpointStats>[] = [
    {
      key: "method",
      header: copy.stats.columns.method,
      width: "100px",
      render: (row) => {
        const methodColor = methodColorOf(row.method);
        return (
          <span
            className="w-max rounded-md px-2 py-0.5 font-mono text-xs font-semibold"
            style={{ background: methodColor.bg, color: methodColor.text }}
          >
            {row.method}
          </span>
        );
      },
    },
    {
      key: "endpoint",
      header: copy.stats.columns.endpoint,
      render: (row) => (
        <span className="truncate font-mono text-sm font-medium text-[#16302b]">{row.path}</span>
      ),
    },
    {
      key: "calls24h",
      header: copy.stats.columns.calls24h,
      width: "110px",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-[#16302b]">{row.calls24h}</span>
      ),
    },
    {
      key: "errors24h",
      header: copy.stats.columns.errors24h,
      width: "110px",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => (
        <span
          className={cn(
            "font-mono text-sm font-semibold",
            row.errorCount24h > 0 ? "text-[#C2412B]" : "text-[#8AA09B]",
          )}
        >
          {row.errorCount24h}
        </span>
      ),
    },
    {
      key: "p95",
      header: copy.stats.columns.p95,
      width: "100px",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => {
        const tone = durationTone(row.p95Ms);
        return (
          <span
            className={cn(
              "font-mono text-sm font-medium",
              tone === "err" ? "text-[#C2412B]" : tone === "warn" ? "text-[#B45309]" : "text-[#16302b]",
            )}
          >
            {formatDuration(row.p95Ms)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E7EEEC] bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-[#16302b]">{copy.stats.title}</h2>

      <div className="max-h-[360px] overflow-y-auto rounded-xl border border-[#E7EEEC]">
        <DataTable
          data={stats}
          columns={columns}
          rowKey={(row) => `${row.method}-${row.path}`}
          isLoading={isLoading}
          isError={isError}
          errorMessage={copy.stats.error}
          emptyMessage={copy.stats.empty}
          headerRowClassName="sticky top-0 z-10 border-b border-[#E7EEEC] bg-[#F3F7F5]"
          rowClassName="border-b border-[#EEF3F1] last:border-0"
        />
      </div>
    </div>
  );
}
