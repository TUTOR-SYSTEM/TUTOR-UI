"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Loader2, RefreshCw, Route, Waypoints } from "lucide-react";

import { Dialog } from "@/components/ui/dialog-form.ui";
import { Button } from "@/components/ui/button.ui";
import { useLogActions } from "@/lib/services/log.service";
import { useLoggerCopy } from "@/hooks/useLoggerCopy.hook";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { getServiceColor, getStatusColor, isErrorLog } from "./logger-data";
import { LogReplayPanel } from "./log-replay-panel";

function formatRequestBody(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export type LogTraceDialogProps = {
  correlationId: string | null;
  onClose: () => void;
  /** Gọi khi 1 hop HTTP trong dialog được "gửi lại" (LogReplayPanel) và sinh ra
   * correlationId MỚI — cha dùng để chuyển dialog sang theo dõi request mới đó,
   * để thấy đủ hop xuyên các service khác thay vì kẹt ở trace cũ. */
  onReplaySent: (correlationId: string) => void;
};

export function LogTraceDialog({
  correlationId,
  onClose,
  onReplaySent,
}: LogTraceDialogProps) {
  const copy = useLoggerCopy();

  const { trace } = useLogActions({
    traceCorrelationId: correlationId ?? undefined,
    traceOptions: { enabled: !!correlationId },
  });

  const hops = useMemo(() => trace.data ?? [], [trace.data]);
  const maxDurationMs = useMemo(
    () => hops.reduce((max, hop) => Math.max(max, hop.durationMs), 0),
    [hops],
  );
  const slowestHopId = useMemo(() => {
    if (hops.length === 0) return null;
    return hops.reduce((slowest, hop) =>
      hop.durationMs > slowest.durationMs ? hop : slowest,
    ).id;
  }, [hops]);

  // Popup chính (mở ngay khi có correlationId) chỉ hiện chi tiết 1 hop — danh
  // sách tracking (tất cả hop qua từng service) tách sang popup RIÊNG, chỉ mở
  // khi bấm icon "Xem tracking", tránh nhồi cả 2 vào cùng 1 popup như trước.
  const [selectedHopId, setSelectedHopId] = useState<string | null>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const activeHopId = useMemo(() => {
    if (hops.some((hop) => hop.id === selectedHopId)) return selectedHopId;
    // Mặc định chọn hop HTTP (thường là điểm vào qua gateway, có thể gửi lại) —
    // nếu trace chỉ toàn hop RPC thì rơi về hop đầu tiên.
    return (hops.find((hop) => hop.type === "HTTP") ?? hops[0])?.id ?? null;
  }, [hops, selectedHopId]);
  const activeHop = hops.find((hop) => hop.id === activeHopId) ?? null;

  return (
    <>
      <Dialog
        isOpen={!!correlationId && !trackingOpen}
        icon={Waypoints}
        title={copy.trace.title}
        subtitle={correlationId ? copy.trace.subtitle(correlationId) : undefined}
        cancelText={copy.trace.closeButton}
        onCancel={onClose}
        submitText={copy.trace.closeButton}
        onSubmit={onClose}
      >
        {trace.isPending && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {copy.trace.loading}
          </div>
        )}

        {trace.isError && (
          <div className="py-10 text-center text-sm text-red-500">
            {getErrorMessage(trace.error, copy.trace.error)}
          </div>
        )}

        {!trace.isPending && !trace.isError && hops.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            {copy.trace.empty}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => trace.refetch()}
              className="w-auto! gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              {copy.trace.refresh}
            </Button>
          </div>
        )}

        {!trace.isPending && !trace.isError && hops.length > 0 && (
          <div className="flex flex-col gap-3">
            {/* Icon nổi ở center-right của popup — thay cho nút "Xem tracking"
                dạng text trước đây — mở popup tracking riêng. */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setTrackingOpen(true)}
              title={`${copy.trace.viewTracking} — ${copy.trace.hopCountSuffix(hops.length)}`}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full! border-[#E7EEEC] bg-white text-[#0E9F8E] shadow-md hover:bg-[#E4F6EF]"
            >
              <Route className="size-4" />
            </Button>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {copy.trace.hopCountSuffix(hops.length)}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => trace.refetch()}
                className="h-auto! w-auto! gap-1 px-1.5 py-0.5 text-xs text-[#0E9F8E] hover:bg-[#E4F6EF]"
              >
                <RefreshCw className="size-3.5" />
                {copy.trace.refresh}
              </Button>
            </div>

            {/* ── Chi tiết hop đang chọn: body, status, trạng thái, gửi lại ── */}
            {activeHop && (
              <div
                className={cn(
                  "rounded-xl border border-[#E7EEEC] bg-white p-3.5",
                  isErrorLog(activeHop) && "border-red-200 bg-red-50/40",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-semibold"
                    style={{
                      background: getServiceColor(activeHop.serviceName).bg,
                      color: getServiceColor(activeHop.serviceName).text,
                    }}
                  >
                    {activeHop.serviceName}
                  </span>
                  <span className="text-sm font-medium text-[#16302b]">
                    {activeHop.method ? `${activeHop.method} ` : ""}
                    {activeHop.path}
                  </span>
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-semibold"
                    style={{
                      background: getStatusColor(activeHop.statusCode).bg,
                      color: getStatusColor(activeHop.statusCode).text,
                    }}
                  >
                    {activeHop.statusCode ?? "—"}
                  </span>
                  {activeHop.id === slowestHopId && hops.length > 1 && (
                    <span className="rounded-md bg-[#FFE8D6] px-2 py-0.5 text-xs font-semibold text-[#E85D24]">
                      {copy.badge.slowest}
                    </span>
                  )}
                  {isErrorLog(activeHop) && (
                    <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                      {copy.badge.error}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(activeHop.createdAt).toLocaleString(
                      copy.language === "vi" ? "vi-VN" : "en-US",
                    )}
                  </span>
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F3F7F5]">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      activeHop.id === slowestHopId && hops.length > 1
                        ? "bg-[#E85D24]"
                        : "bg-[#0E9F8E]",
                    )}
                    style={{
                      width: `${
                        maxDurationMs > 0
                          ? Math.max(2, (activeHop.durationMs / maxDurationMs) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeHop.durationMs} ms
                </p>

                {activeHop.errorMessage && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {activeHop.errorMessage}
                  </p>
                )}

                <div className="mt-2.5">
                  <p className="text-xs font-medium text-[#16302b]">
                    {copy.trace.requestBodyLabel}
                  </p>
                  {formatRequestBody(activeHop.requestBody) ? (
                    <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-[#F3F7F5] p-2 font-mono text-xs text-[#16302b]">
                      {formatRequestBody(activeHop.requestBody)}
                    </pre>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {copy.trace.noBody}
                    </p>
                  )}
                </div>

                {/* `key` bắt buộc — không có thì React coi đây là CÙNG 1
                    instance khi chuyển hop (vd sau khi gửi, dialog switch
                    sang correlationId mới, hoặc chọn hop khác ở popup
                    tracking), giữ nguyên state cũ (fields/result đã gửi) đè
                    lên hop MỚI thay vì reset đúng theo request đang xem. */}
                {activeHop.type === "HTTP" && (
                  <LogReplayPanel
                    key={activeHop.id}
                    hop={activeHop}
                    onSent={onReplaySent}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* ── Popup riêng: danh sách tracking tất cả hop qua từng service ── */}
      <Dialog
        isOpen={trackingOpen}
        icon={Route}
        title={copy.trace.trackingTitle}
        subtitle={copy.trace.hopCountSuffix(hops.length)}
        cancelText={copy.trace.closeButton}
        onCancel={() => setTrackingOpen(false)}
        submitText={copy.trace.closeButton}
        onSubmit={() => setTrackingOpen(false)}
      >
        <div className="flex flex-col gap-1.5">
          {hops.map((hop) => {
            const serviceColor = getServiceColor(hop.serviceName);
            const statusColor = getStatusColor(hop.statusCode);
            const isError = isErrorLog(hop);
            const isSlowest = hop.id === slowestHopId && hops.length > 1;
            const active = hop.id === activeHopId;

            return (
              <button
                key={hop.id}
                type="button"
                onClick={() => {
                  setSelectedHopId(hop.id);
                  setTrackingOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-2 text-left transition-colors",
                  active
                    ? "border-[#0E9F8E] bg-[#F1FBF9]"
                    : "border-[#E7EEEC] bg-white hover:bg-[#F8FAF9]",
                )}
              >
                <span
                  className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold"
                  style={{ background: serviceColor.bg, color: serviceColor.text }}
                >
                  {hop.serviceName}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#16302b]">
                  {hop.method ? `${hop.method} ` : ""}
                  {hop.path}
                </span>
                <span
                  className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold"
                  style={{ background: statusColor.bg, color: statusColor.text }}
                >
                  {hop.statusCode ?? "—"}
                </span>
                {isSlowest && (
                  <span className="shrink-0 rounded-md bg-[#FFE8D6] px-1.5 py-0.5 text-[10px] font-semibold text-[#E85D24]">
                    {copy.badge.slowest}
                  </span>
                )}
                {isError && (
                  <span className="shrink-0 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                    {copy.badge.error}
                  </span>
                )}
                <span className="shrink-0 text-xs text-muted-foreground">
                  {hop.durationMs} ms
                </span>
                <ChevronRight
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-[#0E9F8E]" : "text-[#9AAEA9]",
                  )}
                />
              </button>
            );
          })}
        </div>
      </Dialog>
    </>
  );
}
