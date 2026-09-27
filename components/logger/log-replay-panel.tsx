"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Route, Send } from "lucide-react";

import { useLoggerCopy } from "@/hooks/useLoggerCopy.hook";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";
import { Select } from "@/components/ui/select.ui";
import {
  METHODS_WITH_BODY,
  RAW_BODY_FIELD_KEY,
  getBodyFieldError,
  parseBodyFields,
  sendReplay,
  serializeBodyFields,
  type BodyField,
} from "./logger-data";
import type { ApiError, ApiRequestLog, ApiResponse } from "@/types";

type ReplayResult =
  | { kind: "success"; response: ApiResponse<unknown> }
  | { kind: "error"; error: ApiError };

const BOOLEAN_OPTIONS = [
  { label: "true", value: "true" },
  { label: "false", value: "false" },
];

export type LogReplayPanelProps = {
  hop: ApiRequestLog;
  /** Gọi khi người dùng chủ động bấm "Xem tracking lần gửi này" sau khi gửi
   * (không tự động) — cha (LogTraceDialog) dùng để chuyển sang theo dõi trace
   * của lần gửi mới đó, để thấy đủ hop xuyên các service khác. */
  onSent: (correlationId: string) => void;
};

/**
 * Chỉ render cho hop `type === "HTTP"` (gọi thẳng qua gateway) — hop RPC nội bộ
 * giữa các service không có route HTTP nào để gửi lại từ FE. Chỉ sửa/gửi lại
 * đúng body của hop này — không kéo thêm lịch sử case gần đây của endpoint.
 */
export function LogReplayPanel({ hop, onSent }: LogReplayPanelProps) {
  const copy = useLoggerCopy();
  const method = hop.method ?? "GET";
  const hasBody = METHODS_WITH_BODY.has(method);

  const [fields, setFields] = useState<BodyField[]>(() =>
    parseBodyFields(hop.requestBody),
  );
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<ReplayResult | null>(null);

  const updateFieldValue = (key: string, value: string) => {
    setFields((prev) =>
      prev.map((field) => (field.key === key ? { ...field, value } : field)),
    );
  };

  const fieldErrors = useMemo(() => {
    const messages = {
      required: copy.replay.fieldRequired,
      invalidNumber: copy.replay.invalidNumber,
      invalidJson: copy.replay.invalidJson,
    };
    return fields.map((field) => getBodyFieldError(field, messages));
  }, [fields, copy.replay.fieldRequired, copy.replay.invalidNumber, copy.replay.invalidJson]);

  const canSend = fieldErrors.every((error) => error === null);

  // correlationId của lần gửi vừa xong — KHÔNG tự động chuyển dialog sang trace
  // mới ngay (trước đây gọi `onSent` ngay đây làm dialog switch sau 600ms,
  // khiến hộp kết quả vừa hiện đã bị remount xoá mất — đúng bug "hiện lên rồi
  // mất luôn"). Giờ chỉ chuyển khi người dùng chủ động bấm nút bên dưới, để họ
  // toàn quyền quyết định lúc nào rời khỏi kết quả đang xem.
  const [pendingCorrelationId, setPendingCorrelationId] = useState<
    string | null
  >(null);

  const handleSend = async () => {
    if (!canSend) return;
    if (
      method !== "GET" &&
      !window.confirm(copy.replay.confirmSend(method, hop.path))
    ) {
      return;
    }

    setSending(true);
    setResult(null);
    setPendingCorrelationId(null);
    try {
      const body = hasBody ? serializeBodyFields(fields) : undefined;
      const response = await sendReplay(method, hop.path, body);
      setResult({ kind: "success", response });
      if (response.correlationId) setPendingCorrelationId(response.correlationId);
    } catch (err) {
      const apiError = err as ApiError;
      setResult({ kind: "error", error: apiError });
      if (apiError.data?.correlationId) {
        setPendingCorrelationId(apiError.data.correlationId);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2.5 rounded-lg border border-dashed border-[#E7EEEC] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9AAEA9]">
        {copy.replay.sectionTitle}
      </p>
      <p className="text-xs text-muted-foreground">{copy.replay.warning}</p>

      {hasBody && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-[#16302b]">
            {copy.replay.bodyLabel}
          </p>

          {fields.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {copy.replay.noBodyFields}
            </p>
          )}

          {fields.map((field, index) => {
            const error = fieldErrors[index];
            const label =
              field.key === RAW_BODY_FIELD_KEY
                ? copy.replay.rawBodyLabel
                : field.key;

            return (
              <div key={field.key} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-28 shrink-0 truncate font-mono text-xs text-[#16302b]"
                    title={label}
                  >
                    {label}
                  </span>

                  {field.kind === "boolean" ? (
                    <Select
                      value={field.value}
                      onValueChange={(value) => updateFieldValue(field.key, value)}
                      options={BOOLEAN_OPTIONS}
                      className="h-8! flex-1 text-xs"
                    />
                  ) : field.kind === "json" ? (
                    <textarea
                      value={field.value}
                      onChange={(e) => updateFieldValue(field.key, e.target.value)}
                      rows={3}
                      spellCheck={false}
                      className="w-full flex-1 resize-y rounded-lg border border-[#E7EEEC] bg-white px-2.5 py-1.5 font-mono text-xs text-[#16302b] outline-none placeholder:text-[#9AAEA9] focus:border-[#0E9F8E] focus:ring-2 focus:ring-[#0E9F8E]/30 transition-colors"
                    />
                  ) : (
                    <Input
                      type={
                        field.sensitive
                          ? visibleKeys[field.key]
                            ? "text"
                            : "password"
                          : "text"
                      }
                      value={field.value}
                      onChange={(e) => updateFieldValue(field.key, e.target.value)}
                      placeholder={
                        field.sensitive
                          ? copy.replay.sensitiveFieldPlaceholder(field.key)
                          : undefined
                      }
                      invalid={!!error}
                      className="h-8! flex-1 text-xs"
                    />
                  )}

                  {field.sensitive && field.kind !== "json" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      title={
                        visibleKeys[field.key]
                          ? copy.replay.hideValue
                          : copy.replay.showValue
                      }
                      onClick={() =>
                        setVisibleKeys((prev) => ({
                          ...prev,
                          [field.key]: !prev[field.key],
                        }))
                      }
                    >
                      {visibleKeys[field.key] ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </Button>
                  )}
                </div>

                {field.sensitive && (
                  <p className="text-[11px] text-amber-600">
                    {copy.replay.sensitiveFieldHint}
                  </p>
                )}
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleSend}
          loading={sending}
          disabled={!canSend}
          className="w-auto! gap-1.5"
        >
          <Send className="size-3.5" />
          {copy.replay.sendButton(method)}
        </Button>
        <span className="truncate font-mono text-xs text-muted-foreground">
          {method} {hop.path}
        </span>
      </div>

      {result && (
        <div
          className={cn(
            "rounded-lg border p-2.5 text-xs",
            result.kind === "success"
              ? "border-[#0E9F8E]/30 bg-[#E4F6EF] text-[#0B7A6D]"
              : "border-red-200 bg-red-50 text-red-600",
          )}
        >
          <p className="font-semibold">
            {result.kind === "success"
              ? copy.replay.resultSuccess(result.response.statusCode)
              : copy.replay.resultError(result.error.statusCode)}
          </p>
          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono">
            {result.kind === "success"
              ? JSON.stringify(
                  result.response.data ?? result.response.message,
                  null,
                  2,
                )
              : getErrorMessage(result.error)}
          </pre>

          {pendingCorrelationId && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => onSent(pendingCorrelationId)}
              className="mt-2 w-auto! gap-1.5 bg-white!"
            >
              <Route className="size-3.5" />
              {copy.replay.viewNewTrace}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
