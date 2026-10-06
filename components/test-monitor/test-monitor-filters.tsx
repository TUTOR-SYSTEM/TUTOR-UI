"use client";

import { ChevronsDownUp, ChevronsUpDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Label } from "@/components/ui/label.ui";
import { serviceColorOf } from "@/components/logger/logger-utils";
import { flowServiceLabel } from "./test-monitor-utils";
import { cn } from "@/lib/utils";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type { TestMonitorResultFilter } from "@/types";

const RESULT_KEYS: TestMonitorResultFilter[] = ["all", "err", "slow", "ok"];

function Chip({
  active,
  onClick,
  count,
  children,
  variant,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: React.ReactNode;
  variant: "tab" | "service";
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-8! w-auto! gap-1.5 rounded-lg! px-3! text-xs font-semibold",
        variant === "tab"
          ? active
            ? "bg-[#10302B]! text-white!"
            : "bg-[#F3F7F5] text-[#5C726D] hover:bg-[#E7EEEC]!"
          : active
            ? "border-[#0E9F8E]! bg-[#E4F6EF]! text-[#0B7A6D]!"
            : "border-[#E7EEEC]! bg-white text-[#16302b] hover:bg-[#F3F7F5]!",
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn("text-[11px] font-bold", active ? "text-white/70" : "text-[#8AA09B]")}>{count}</span>
      )}
    </Button>
  );
}

/** Thanh công cụ của card "Danh sách request": tab kết quả + mở/thu case + tìm kiếm, và hàng chip
 * lọc theo service. */
export function TestMonitorFilters({
  endpointCount,
  services,
  service,
  onServiceChange,
  resultCounts,
  result,
  onResultChange,
  allExpanded,
  onToggleExpandAll,
  search,
  onSearchChange,
  copy,
}: {
  endpointCount: number;
  services: string[];
  /** `null` = mọi service. */
  service: string | null;
  onServiceChange: (service: string | null) => void;
  resultCounts: Record<TestMonitorResultFilter, number>;
  result: TestMonitorResultFilter;
  onResultChange: (result: TestMonitorResultFilter) => void;
  allExpanded: boolean;
  onToggleExpandAll: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  copy: TestMonitorDictionary;
}) {
  const ExpandIcon = allExpanded ? ChevronsDownUp : ChevronsUpDown;
  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold text-[#16302b]">
            {copy.filters.title} <span className="font-medium text-[#8AA09B]">· {endpointCount}</span>
          </h2>
          {RESULT_KEYS.map((key) => (
            <Chip
              key={key}
              variant="tab"
              active={result === key}
              onClick={() => onResultChange(key)}
              count={resultCounts[key]}
            >
              {copy.filters.result[key]}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onToggleExpandAll}
            className="h-9! w-auto! gap-1.5 rounded-lg! px-3! text-xs font-semibold"
          >
            <ExpandIcon className="size-3.5" />
            {allExpanded ? copy.filters.collapseAll : copy.filters.expandAll}
          </Button>
          <div className="relative">
            <Label htmlFor="test-monitor-search" className="sr-only">
              {copy.filters.searchLabel}
            </Label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8AA09B]" />
            <Input
              id="test-monitor-search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={copy.filters.searchPlaceholder}
              className="h-9! w-60 rounded-lg! pl-9 text-sm"
            />
          </div>
        </div>
      </div>

      {services.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-[#EEF3F1] px-5 py-3">
          <span className="mr-1 text-[11px] font-bold tracking-wide text-[#8AA09B] uppercase">
            {copy.filters.serviceLabel}
          </span>
          {services.map((name) => (
            <Chip
              key={name}
              variant="service"
              active={service === name}
              onClick={() => onServiceChange(service === name ? null : name)}
            >
              <span className="size-2 shrink-0 rounded-full" style={{ background: serviceColorOf(name) }} />
              {flowServiceLabel(name)}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
