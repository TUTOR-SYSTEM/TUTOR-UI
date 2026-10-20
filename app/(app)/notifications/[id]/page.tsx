"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Clock, Loader2, XCircle } from "lucide-react";

import {
  useNotificationActions,
  NOTIFICATIONS_QUERY_KEY,
} from "@/lib/services/notification.service";
import { getErrorMessage } from "@/lib/axios";
import type { NotificationType } from "@/types";
import { safeRedirectHref } from "@/lib/notification-redirect";

const TYPE_LABELS: Record<NotificationType, string> = {
  SYSTEM: "Hệ thống",
  TUITION: "Học phí",
  STUDENT: "Học sinh",
  TUTOR: "Gia sư",
};

const TYPE_BADGE: Record<string, { bg: string; text: string }> = {
  TUITION: { bg: "#FFF0E6", text: "#E85D24" },
  SYSTEM: { bg: "#EEF2FF", text: "#4F46E5" },
  STUDENT: { bg: "#E4F6EF", text: "#0B7A6D" },
  TUTOR: { bg: "#F3E8FF", text: "#7C3AED" },
};
const FALLBACK_BADGE = { bg: "#F3F7F5", text: "#16302b" };

export default function NotificationDetailPage() {
  const params = useParams<{ id: string }>();
  const notificationId = params.id;
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

  const {
    data: notification,
    isLoading,
    error,
  } = useNotificationActions({ detailId: notificationId }).detail;

  const markRead = useNotificationActions().markRead;

  const handleMarkRead = () => {
    if (!notification) return;
    markRead.mutate(notification.id, {
      onSuccess: () => {
        invalidate();
        toast.success("Đã đánh dấu đã đọc");
      },
      onError: (err) =>
        toast.error(getErrorMessage(err, "Không thể đánh dấu đã đọc")),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-[#0E9F8E]" />
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <XCircle className="size-12 text-red-400" />
        <p className="text-sm text-red-500">
          {getErrorMessage(error, "Không tìm thấy thông báo.")}
        </p>
        <Link
          href="/notifications"
          className="text-sm font-medium text-[#0E9F8E] hover:underline"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const badge = TYPE_BADGE[notification.type] ?? FALLBACK_BADGE;
  const date = new Date(notification.createdAt).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/notifications"
          className="flex items-center gap-1.5 text-sm text-[#9AAEA9] hover:text-[#16302b] transition-colors"
        >
          <ArrowLeft className="size-4" />
          Quay lại
        </Link>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-[#E7EEEC] bg-white p-6 shadow-sm">
        {/* Badge + Mark read */}
        <div className="mb-4 flex items-center justify-between">
          <span
            className="rounded-md px-2.5 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: badge.bg, color: badge.text }}
          >
            {TYPE_LABELS[notification.type]}
          </span>
          {!notification.isRead && (
            <button
              type="button"
              onClick={handleMarkRead}
              className="rounded-lg bg-[#0E9F8E] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#0b7a6d] transition-colors"
            >
              Đánh dấu đã đọc
            </button>
          )}
        </div>

        {/* Title */}
        <h1 className="mb-3 text-xl font-bold leading-snug text-[#16302b]">
          {notification.title}
        </h1>

        {/* Timestamp */}
        <div className="mb-5 flex items-center gap-1.5 text-xs text-[#9AAEA9]">
          <Clock className="size-3.5 shrink-0" />
          {date}
        </div>

        {/* Sub content */}
        {notification.subContent && (
          <p className="mb-3 text-xs text-[#9AAEA9]">{notification.subContent}</p>
        )}

        {/* Content */}
        {notification.content && (
          <p className="mb-5 text-sm leading-relaxed text-[#5c726d]">
            {notification.content}
          </p>
        )}

        {/* Action link */}
        {safeRedirectHref(notification.redirectUrl) && (
          <a
            href={safeRedirectHref(notification.redirectUrl) ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg border border-[#E7EEEC] px-4 py-2 text-sm font-medium text-[#0E9F8E] hover:bg-[#F1FBF9] transition-colors"
          >
            {notification.actionLabel ?? "Xem chi tiết"}
          </a>
        )}
      </div>
    </div>
  );
}
