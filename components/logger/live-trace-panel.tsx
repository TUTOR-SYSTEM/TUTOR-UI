import { useEffect, useRef, useState } from "react";
import { Square, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button.ui";
import { serviceNameOf } from "./logger-utils";
import type { LoggerDictionary } from "@/lib/i18n/logger.dictionary";
import type { LiveTraceState, PlaybackLine, PlaybackLineTone } from "@/types";

const LINE_COLOR: Record<PlaybackLineTone, string> = {
  plain: "#D5E6E2",
  muted: "#6B8B85",
  ok: "#D5E6E2",
  warn: "#F5C26B",
  err: "#F4907F",
  pass: "#34D399",
  fail: "#F87171",
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const formatClock = (ms: number) => {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}`;
};

/** Log cuộn của một lần chạy: từng dòng hiện ra theo nhịp phát lại (gửi → vào từng service → trả về
 * → kết quả). `live = null` là trạng thái chờ (chưa bấm "Chạy realtime") — vẫn hiện khung kèm gợi ý. */
export function LiveTracePanel({
  live,
  running,
  subtitle,
  lines,
  copy,
  onStop,
  focusService,
  onClearFocus,
}: {
  live: LiveTraceState | null;
  /** Còn đang chờ log hoặc đang phát lại (chưa hiện hết dòng). */
  running: boolean;
  /** Dòng trạng thái cạnh tiêu đề: request đang đi tới đâu / lần chạy gần nhất. */
  subtitle: string;
  /** Các dòng đã hiện, kèm mốc giờ. */
  lines: { line: PlaybackLine; time: number }[];
  copy: LoggerDictionary;
  onStop?: () => void;
  /** Chỉ hiện các dòng của service này (chọn bằng cách click ô service ở sơ đồ). */
  focusService?: string | null;
  onClearFocus?: () => void;
}) {
  const visibleLines = focusService
    ? lines.filter(({ line }) => line.services.length === 0 || line.services.includes(focusService))
    : lines;
  const endRef = useRef<HTMLDivElement>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Ticks only while the run is in flight; when it settles the last value stays as the final elapsed.
  useEffect(() => {
    if (!running) return;
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt), 100);
    return () => clearInterval(timer);
  }, [running, live?.correlationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [visibleLines.length]);

  return (
    <div className="overflow-hidden rounded-xl border border-[#1F3A35] bg-[#0F1F1C]">
      <div className="flex items-center gap-2 border-b border-[#1F3A35] px-4 py-2.5">
        <span className={cn("size-2 rounded-full", running ? "animate-pulse bg-[#34D399]" : "bg-[#6B8B85]")} />
        <h3 className="text-xs font-bold tracking-wide text-[#D5E6E2]">{copy.detail.live.title}</h3>
        <span className="text-[11px] text-[#6B8B85]">{subtitle}</span>
        {live && (
          <span className="ml-auto flex items-center gap-2 text-[11px] text-[#6B8B85]">
            <span className="font-mono">
              {copy.detail.live.hops(live.rows.length)} · {(elapsedMs / 1000).toFixed(1)}s
            </span>
            {running ? copy.detail.live.streaming : copy.detail.live.done}
            {running && onStop && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="h-7! w-auto! gap-1 text-[#D5E6E2]! hover:bg-[#1F3A35]!"
                onClick={onStop}
              >
                <Square className="size-3" />
                {copy.detail.live.stop}
              </Button>
            )}
          </span>
        )}
      </div>

      {focusService && (
        <div className="flex items-center gap-2 px-4 pt-2 text-[11px] text-[#D5E6E2]">
          <span>{copy.detail.live.tracking(serviceNameOf(focusService))}</span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-6! w-auto! gap-1 text-[#D5E6E2]! hover:bg-[#1F3A35]!"
            onClick={onClearFocus}
          >
            <X className="size-3" />
            {copy.detail.live.clearTracking}
          </Button>
        </div>
      )}

      <div className="max-h-44 min-h-14 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed">
        {!live && <p className="text-[#6B8B85]">{copy.detail.live.idleHint}</p>}
        {visibleLines.map(({ line, time }) => (
          <p key={line.key} className="flex gap-2 whitespace-pre-wrap break-all">
            <span className="shrink-0 text-[#6B8B85]">{formatClock(time)}</span>
            <span style={{ color: LINE_COLOR[line.tone] }}>{line.text}</span>
          </p>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
