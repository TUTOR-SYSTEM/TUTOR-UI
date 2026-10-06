import { Play } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { TableCell, TableRow } from "@/components/ui/table.ui";
import { STATUS_TONE_STYLE, durationTone, formatDuration } from "@/components/logger/logger-utils";
import { cn } from "@/lib/utils";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type { ApiTestScenario } from "@/types";
import { ResultPill } from "./test-monitor-badges";
import { caseResultOf } from "./test-monitor-utils";

const toneText = (tone: "ok" | "warn" | "err") => STATUS_TONE_STYLE[tone].text;

/** Hàng case con (1 kịch bản): kết quả lần chạy gần nhất, loại case, tên, mô tả, kỳ vọng vs thực
 * tế, thời lượng và nút Test. Bấm hàng (khi đã có lần chạy) mở dialog trace của lần đó. */
export function TestMonitorCaseRow({
  scenario,
  running,
  disabled,
  onRun,
  onOpenTrace,
  copy,
}: {
  scenario: ApiTestScenario;
  running: boolean;
  disabled: boolean;
  onRun: (scenario: ApiTestScenario) => void;
  onOpenTrace: (scenario: ApiTestScenario) => void;
  copy: TestMonitorDictionary;
}) {
  const last = scenario.lastRun;
  const result = caseResultOf(scenario);
  const durationColor = last && durationTone(last.durationMs);
  const isValid = scenario.category === "valid";
  const badgeTone = STATUS_TONE_STYLE[isValid ? "ok" : "warn"];

  return (
    <TableRow
      onClick={last ? () => onOpenTrace(scenario) : undefined}
      aria-label={last ? copy.list.openTrace(scenario.name) : undefined}
      className={cn(
        "border-b border-[#EEF3F1] bg-[#FAFCFB] last:border-0",
        last && "cursor-pointer hover:bg-[#F1FBF9]",
      )}
    >
      <TableCell className="py-2.5 pr-3 pl-10">
        {result === "never" ? (
          <span className="text-xs text-[#8AA09B]">{copy.list.neverRun}</span>
        ) : (
          <ResultPill result={result} label={copy.list.result[result]} />
        )}
      </TableCell>
      <TableCell className="px-3 py-2.5">
        <span
          title={copy.list.category[scenario.category]}
          className="rounded px-1.5 py-0.5 text-[10px] font-bold"
          style={{ background: badgeTone.bg, color: badgeTone.text }}
        >
          {copy.list.categoryBadge[isValid ? "valid" : "other"]}
        </span>
      </TableCell>
      <TableCell className="px-3 py-2.5 text-sm font-semibold text-[#16302b]">{scenario.name}</TableCell>
      <TableCell className="max-w-72 px-3 py-2.5">
        <p className="truncate font-mono text-xs text-[#5C726D]" title={scenario.description ?? undefined}>
          {scenario.description ?? "—"}
        </p>
      </TableCell>
      <TableCell colSpan={2} className="px-3 py-2.5 text-right text-xs text-[#8AA09B]">
        {copy.list.expected} <span className="font-mono font-bold text-[#16302b]">{scenario.expectedStatus}</span>
        {" · "}
        {copy.list.actual}{" "}
        {last ? (
          <span
            className="font-mono font-bold"
            style={{ color: toneText(last.actualStatus === scenario.expectedStatus ? "ok" : "err") }}
          >
            {last.actualStatus ?? copy.list.noResponse}
          </span>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell
        className="px-3 py-2.5 text-right font-mono text-sm font-bold"
        style={{ color: durationColor ? toneText(durationColor) : "#16302b" }}
      >
        {last ? formatDuration(last.durationMs) : "—"}
      </TableCell>
      <TableCell className="px-3 py-2.5 text-right">
        <Button
          type="button"
          size="sm"
          variant="outline"
          loading={running}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onRun(scenario);
          }}
          className="h-8! w-auto! gap-1.5 bg-[#E4F6EF]! px-3! text-[#0B7A6D]!"
        >
          {!running && <Play className="size-3" />}
          {running ? copy.list.running : copy.list.testButton}
        </Button>
      </TableCell>
    </TableRow>
  );
}
