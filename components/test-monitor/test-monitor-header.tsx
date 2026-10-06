import { Play } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import type { TestMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";
import type { TestMonitorRunAllProgress } from "@/types";
import { describeRunAt } from "./test-monitor-utils";

export function TestMonitorHeader({
  endpointCount,
  caseCount,
  lastRunAt,
  progress,
  disabled,
  onRunAll,
  copy,
}: {
  endpointCount: number;
  caseCount: number;
  /** `lastRun.runAt` mới nhất của mọi case; `null` = chưa chạy. */
  lastRunAt: string | null;
  /** Đang chạy toàn bộ (tuần tự) thì có giá trị. */
  progress: TestMonitorRunAllProgress | null;
  /** Khoá nút khi đang chạy 1 case lẻ hoặc chưa có case nào. */
  disabled: boolean;
  onRunAll: () => void;
  copy: TestMonitorDictionary;
}) {
  const lastRun = lastRunAt ? describeRunAt(lastRunAt) : null;
  const lastRunText = !lastRun
    ? copy.page.lastRunNever
    : lastRun.isToday
      ? copy.page.lastRunToday(lastRun.time)
      : copy.page.lastRunOn(lastRun.date, lastRun.time);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#16302b]">{copy.page.title}</h1>
        <p className="mt-0.5 text-sm text-[#8AA09B]">{copy.page.subtitle(endpointCount, caseCount)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm text-[#8AA09B]">
          {copy.page.lastRun} <span className="font-bold text-[#16302b]">{lastRunText}</span>
        </p>
        <Button
          type="button"
          loading={progress !== null}
          disabled={disabled}
          onClick={onRunAll}
          className="h-11! w-auto! gap-2 rounded-xl! bg-[#0E9F8E]! px-5! text-sm font-bold shadow-md hover:bg-[#0B8A7B]!"
        >
          {progress === null && <Play className="size-4" />}
          {progress === null ? copy.page.runAll(caseCount) : copy.page.runAllProgress(progress.done, progress.total)}
        </Button>
      </div>
    </header>
  );
}
