"use client";

import { Button } from "@/components/ui/button.ui";
import { SERVICE_STYLES } from "@/components/flow-requests/flow-request-data";
import { cn } from "@/lib/utils";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type { TestMonitorResultFilter } from "@/types";

const RESULT_KEYS: TestMonitorResultFilter[] = ["all", "err", "slow", "ok"];

function serviceColorOf(service: string): string {
  const styles = SERVICE_STYLES as Record<string, { color: string; bg: string }>;
  return (styles[service] ?? SERVICE_STYLES.direct).color;
}

function Chip({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-8! w-auto! gap-1.5 rounded-full! px-3! text-xs font-semibold",
        active
          ? "bg-[#0E9F8E]! text-white!"
          : "bg-[#F3F7F5] text-[#5C726D] hover:bg-[#E7EEEC]!",
      )}
    >
      {children}
      <span
        className={cn(
          "rounded-full px-1.5 py-px text-[10px] font-bold",
          active ? "bg-white/25" : "bg-white text-[#8AA09B]",
        )}
      >
        {count}
      </span>
    </Button>
  );
}

export function TestMonitorFilters({
  services,
  serviceCounts,
  totalCount,
  service,
  onServiceChange,
  resultCounts,
  result,
  onResultChange,
  copy,
}: {
  services: string[];
  serviceCounts: Record<string, number>;
  totalCount: number;
  /** `null` = mọi service. */
  service: string | null;
  onServiceChange: (service: string | null) => void;
  resultCounts: Record<TestMonitorResultFilter, number>;
  result: TestMonitorResultFilter;
  onResultChange: (result: TestMonitorResultFilter) => void;
  copy: TestMonitorDictionary;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={service === null} onClick={() => onServiceChange(null)} count={totalCount}>
          {copy.filters.serviceAll}
        </Chip>
        {services.map((name) => (
          <Chip
            key={name}
            active={service === name}
            onClick={() => onServiceChange(name)}
            count={serviceCounts[name] ?? 0}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: serviceColorOf(name) }}
            />
            {name}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {RESULT_KEYS.map((key) => (
          <Chip
            key={key}
            active={result === key}
            onClick={() => onResultChange(key)}
            count={resultCounts[key]}
          >
            {copy.filters.result[key]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
