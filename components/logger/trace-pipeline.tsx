import { cn } from "@/lib/utils";
import {
  CLIENT_KEY,
  STATUS_TONE_STYLE,
  pipelineHops,
  serviceColorOf,
  serviceNameOf,
} from "./logger-utils";
import type { LoggerDictionary } from "@/lib/i18n/logger.dictionary";
import type { LoggerTraceNode } from "@/types";

/** Tiến độ của một lần "Chạy realtime" đang phát lại: các service request đã chạm tới và nơi request
 * đang ở (`CLIENT_KEY` = đã trả về client). */
export type TracePipelineProgress = { entered: string[]; current: string | null };

/** Sơ đồ ngang CLIENT → service → service…, mỗi service 1 ô: tên + trạng thái/thời lượng, viền tô
 * theo trạng thái xấu nhất của các hop thuộc service đó (`nodeStatusTone`). Nhãn trên mũi tên là
 * loại hop dẫn vào service (HTTP / RPC).
 *
 * Có `progress` (đang chạy realtime) thì mỗi ô ở 1 trong 3 trạng thái: "Chờ" (mờ, nét đứt), "Đang xử
 * lý" (viền teal, mũi tên dẫn vào có chấm chạy) hoặc kết quả (OK/ERR + ms). `expectedServices` (đường
 * đi của lần chạy trước) giữ nguyên khung sơ đồ trong lúc chờ log, nên chạy lại không làm sơ đồ co
 * rồi bật ra. */
export function TracePipeline({
  nodes,
  copy,
  activeService,
  focusService,
  onSelectService,
  expectedServices,
  skipped,
  progress,
}: {
  nodes: LoggerTraceNode[];
  copy: LoggerDictionary;
  /** Service của span đang xem chi tiết (viền đậm). */
  activeService?: string | null;
  /** Service đang được theo dõi realtime (click ô để bật/tắt). */
  focusService?: string | null;
  onSelectService?: (service: string | null) => void;
  expectedServices?: string[];
  /** Service của đường đi cũ mà lần chạy này không tới được (do lỗi phía trước) — hiện "Bỏ qua". */
  skipped?: string[];
  progress?: TracePipelineProgress;
}) {
  const arrived = pipelineHops(nodes);
  const order = expectedServices
    ? [
        ...expectedServices,
        ...arrived.map((h) => h.service).filter((svc) => !expectedServices.includes(svc)),
      ]
    : arrived.map((h) => h.service);
  // Nothing known yet on a first-ever run: one anonymous waiting box so the packet has somewhere to go.
  const items: { service: string; hop: (typeof arrived)[number] | null }[] =
    order.length === 0 && progress
      ? [{ service: "", hop: null }]
      : order
          .map((service) => ({ service, hop: arrived.find((h) => h.service === service) ?? null }))
          .filter((item) => progress || item.hop || skipped?.includes(item.service));

  const clientCurrent = progress?.current === CLIENT_KEY;
  const firstPending = progress ? !progress.entered.includes(items[0]?.service ?? "") : false;

  return (
    <div role="group" aria-label={copy.detail.pipeline.title} className="flex items-stretch overflow-x-auto p-1">
      <div
        className={cn(
          "flex min-w-[92px] shrink-0 flex-col justify-center rounded-xl border px-3 py-2 transition-colors duration-300",
          clientCurrent ? "border-2 border-dashed border-[#0E9F8E] bg-[#F1FBF8]" : "border-dashed border-[#C9D6D2]",
        )}
      >
        <span className="text-[10px] font-bold tracking-wide text-[#8AA09B]">{copy.detail.pipeline.client}</span>
        <span className="text-sm font-bold text-[#16302b]">{copy.detail.pipeline.clientHint}</span>
      </div>

      {items.map(({ service, hop }, i) => {
        const state: "waiting" | "processing" | "done" | "skipped" = skipped?.includes(service) && !hop
          ? "skipped"
          : !progress
          ? hop
            ? "done"
            : "waiting"
          : progress.current === service
            ? "processing"
            : hop && progress.entered.includes(service)
              ? "done"
              : "waiting";
        const waiting = state === "waiting" || state === "skipped";
        const processing = state === "processing";
        const color = serviceColorOf(service);
        const tone = STATUS_TONE_STYLE[hop?.tone ?? "ok"];
        const focused = !waiting && focusService === service;
        const active = !waiting && activeService === service;
        const protocol = nodes.find((n) => n.serviceName === service)?.type ?? (i === 0 ? "HTTP" : "RPC");
        // The packet rides the arrow into whichever box holds the request — or the first arrow when
        // the response is back at the client / the request hasn't reached the first hop yet.
        const packet = processing || (i === 0 && (clientCurrent || (firstPending && !!progress && !progress.current)));
        return (
          <div key={service || "waiting"} className="flex shrink-0 items-stretch">
            <div className="flex w-16 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-[#8AA09B]">
              <span className={cn(processing && "text-[#0E9F8E]")}>{protocol}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "relative block h-px w-10 transition-colors duration-300",
                  waiting && !packet ? "bg-[#C9D6D2]" : "bg-[#0E9F8E]",
                )}
              >
                {packet && (
                  <span className="absolute -top-[2px] left-0 size-[5px] animate-[trace-packet_0.7s_linear_infinite] rounded-full bg-[#0E9F8E]" />
                )}
              </span>
            </div>
            <button
              type="button"
              disabled={!onSelectService || waiting}
              aria-pressed={onSelectService && !waiting ? focused : undefined}
              onClick={() => onSelectService?.(focused ? null : service)}
              className={cn(
                "flex min-w-[124px] flex-col gap-1 rounded-xl border bg-white px-3 py-2 text-left transition-[opacity,border-color,background-color] duration-300",
                waiting && "border-dashed border-[#C9D6D2] bg-[#FAFCFB] opacity-60",
                processing && "border-2 border-[#0E9F8E] bg-[#F1FBF8] shadow-sm",
                state === "done" && (active || focused ? "border-2 shadow-sm" : "border-[#E7EEEC]"),
                onSelectService && !waiting ? "cursor-pointer" : "cursor-default",
                focusService && !focused && state === "done" && "opacity-45",
              )}
              style={{
                borderColor:
                  state !== "done" || !hop
                    ? undefined
                    : hop.tone === "ok"
                      ? active || focused
                        ? color
                        : undefined
                      : tone.text,
                background: state === "done" && hop && hop.tone !== "ok" ? tone.bg : undefined,
              }}
            >
              <span className="flex items-center gap-1.5">
                <span className="size-2 shrink-0 rounded-[3px]" style={{ background: waiting ? "#C9D6D2" : color }} />
                <span className="text-sm font-bold whitespace-nowrap text-[#16302b]">
                  {service ? serviceNameOf(service) : "…"}
                </span>
              </span>
              <span className="flex items-center justify-between gap-3 font-mono text-[11px]">
                {state === "done" && hop ? (
                  <>
                    <span className="font-bold" style={{ color: tone.text }}>
                      {hop.tone.toUpperCase()}
                    </span>
                    <span className="text-[#5C726D]">{hop.durationMs}ms</span>
                  </>
                ) : (
                  <>
                    <span className={cn("font-semibold", processing ? "animate-pulse text-[#0E9F8E]" : "text-[#8AA09B]")}>
                      {processing
                        ? copy.detail.pipeline.processing
                        : state === "skipped"
                          ? copy.detail.pipeline.skipped
                          : copy.detail.pipeline.waiting}
                    </span>
                    <span className="text-[#8AA09B]">–</span>
                  </>
                )}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
