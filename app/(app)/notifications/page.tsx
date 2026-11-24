"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { Clock, Loader2, X } from "lucide-react";

import { Search } from "lucide-react";

import {
  useNotificationActions,
  useNotificationCounts,
  NOTIFICATIONS_QUERY_KEY,
} from "@/lib/services/notification.service";
import { getErrorMessage } from "@/lib/axios";
import { safeRedirectHref } from "@/lib/notification-redirect";
import type { NotificationType, ApiNotification } from "@/types";
import UsageGuides, {
  type UsageGuideStep,
} from "@/components/ui/usage-guide.ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.ui";
import { Button } from "@/components/ui/button.ui";
import { Input } from "@/components/ui/input.ui";

/* ─── Config ─── */
const TYPE_LABELS: Record<NotificationType, string> = {
  SYSTEM: "Hệ thống",
  TUITION: "Học phí",
  STUDENT: "Học sinh",
  TUTOR: "Gia sư",
};

const TYPE_TABS: {
  label: string;
  value: NotificationType | "";
  dot: string;
}[] = [
  { label: "Tất cả", value: "", dot: "" },
  { label: "Hệ thống", value: "SYSTEM", dot: "#2563EB" },
  { label: "Học phí", value: "TUITION", dot: "#F97316" },
  { label: "Học sinh", value: "STUDENT", dot: "#0E9F8E" },
  { label: "Gia sư", value: "TUTOR", dot: "#7C3AED" },
];

const TYPE_BADGE: Record<string, string> = {
  TUITION: "bg-[#FFF0E6] text-[#E85D24] dark:bg-[#E85D24]/15 dark:text-[#FF9A6B]",
  SYSTEM: "bg-[#EEF2FF] text-[#4F46E5] dark:bg-[#4F46E5]/15 dark:text-[#A5B4FC]",
  STUDENT: "bg-[#E4F6EF] text-[#0B7A6D] dark:bg-[#0E9F8E]/15 dark:text-[#5EEAD4]",
  TUTOR: "bg-[#F3E8FF] text-[#7C3AED] dark:bg-[#7C3AED]/15 dark:text-[#C4B5FD]",
};
const FALLBACK_BADGE = "bg-muted text-foreground";

const PAGE_SIZE = 5;

const USAGE_GUIDE_STEPS: UsageGuideStep[] = [
  {
    n: 1,
    title: "Lọc theo nhóm",
    body: (
      <>
        Chọn các thẻ{" "}
        <span className="font-semibold text-[#4F46E5]">Hệ thống</span>,{" "}
        <span className="font-semibold text-[#E85D24]">Học phí</span>,{" "}
        <span className="font-semibold text-[#0E9F8E]">Học sinh</span>,{" "}
        <span className="font-semibold text-[#7C3AED]">Gia sư</span> ở thanh
        lọc để thu hẹp danh sách.
      </>
    ),
  },
  {
    n: 2,
    title: "Xem chi tiết",
    body: (
      <>
        Nhấn một dòng hoặc nút{" "}
        <span className="font-semibold text-[#0E9F8E]">Xem →</span> để mở
        toàn bộ nội dung ở khung bên phải.
      </>
    ),
  },
  {
    n: 3,
    title: "Chấm cam = chưa đọc",
    body: (
      <>
        Dòng có chấm cam là thông báo chưa đọc; mở chi tiết rồi nhấn{" "}
        <span className="font-semibold text-[#16302b]">Đánh dấu đã đọc</span>{" "}
        để cập nhật.
      </>
    ),
  },
  {
    n: 4,
    title: "Phân trang",
    body: (
      <>
        Dữ liệu được tải từ server theo trang. Dùng nút{" "}
        <span className="font-semibold text-[#16302b]">Trước / Sau</span> để
        điều hướng.
      </>
    ),
  },
];

const USAGE_GUIDE_WARNING = (
  <>
    <span className="font-semibold text-[#E85D24]">Lưu ý:</span> Thông báo tự
    động lưu trong 30 ngày rồi được dọn khỏi danh sách. Hãy xử lý sớm các mục{" "}
    <span className="font-semibold text-[#E85D24]">Học phí</span> và{" "}
    <span className="font-semibold text-[#0E9F8E]">Học sinh</span> còn chưa
    đọc để không bỏ lỡ.
  </>
);

/* ─── Detail Panel ─── */
function DetailPanel({
  notification,
  onClose,
  onMarkRead,
}: {
  notification: ApiNotification;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}) {
  const badge = TYPE_BADGE[notification.type] ?? FALLBACK_BADGE;
  const date = new Date(notification.createdAt).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex w-95 shrink-0 flex-col rounded-xl border border-border bg-card shadow-sm overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border-light px-5 pt-5 pb-4">
        <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${badge}`}>
          {TYPE_LABELS[notification.type]}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          aria-label="Đóng"
          className="text-muted-foreground"
        >
          <X />
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 px-5 py-4">
        <h2 className="text-base font-bold leading-snug text-foreground">
          {notification.title}
        </h2>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5 shrink-0" />
          {date}
        </div>

        {notification.subContent && (
          <p className="text-xs text-muted-foreground">{notification.subContent}</p>
        )}

        {notification.content && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {notification.content}
          </p>
        )}

        {safeRedirectHref(notification.detailUrl ?? notification.redirectUrl) && (
          <Link
            href={safeRedirectHref(notification.detailUrl ?? notification.redirectUrl) ?? "/notifications"}
            className="mt-1 w-full rounded-lg border border-[#0E9F8E] py-2 text-center text-sm font-semibold text-[#0E9F8E] hover:bg-primary-soft transition-colors"
          >
            {notification.actionLabel ?? "Xem chi tiết"}
          </Link>
        )}

        {!notification.isRead && (
          <button
            type="button"
            onClick={() => onMarkRead(notification.id)}
            className="mt-1 w-full rounded-lg bg-[#0E9F8E] py-2 text-sm font-semibold text-white hover:bg-[#0b7a6d] transition-colors"
          >
            Đánh dấu đã đọc
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Component ─── */
export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<NotificationType | "">("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

  /* ── list notifications ── */
  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      type: activeTab || undefined,
    }),
    [page, search, activeTab],
  );

  const notificationActions = useNotificationActions({ list: params });
  const {
    data: apiPayload,
    isPending,
    isError,
    error,
  } = notificationActions.list;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const notificationList = apiPayload?.data ?? [];
  const pagination = apiPayload?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  /* ── mark as read ── */
  const markRead = notificationActions.markRead;
  const markReadOptions = {
    onSuccess: () => invalidate(),
    onError: (err: Error) =>
      toast.error(getErrorMessage(err, "Không thể đánh dấu đã đọc")),
  };

  const counts = useNotificationCounts();

  const selectedNotification =
    notificationList.find((n) => n.id === selectedId) ?? null;

  const openDetail = (n: ApiNotification) => {
    setSelectedId(n.id);
    if (!n.isRead) {
      markRead.mutate(n.id, markReadOptions);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Search + Filter tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tiêu đề..."
            className="w-56 rounded-lg pl-9 pr-3 md:text-sm"
          />
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex flex-wrap items-center gap-2">
        {TYPE_TABS.map((tab) => {
          const count = tab.value
            ? (counts[tab.value as NotificationType] ?? 0)
            : counts.total;
          const isActive = activeTab === tab.value;
          return (
            <Button
              key={tab.value}
              type="button"
              variant={isActive ? "default" : "outline"}
              onClick={() => {
                setActiveTab(tab.value);
                setPage(1);
              }}
              className={`h-9 gap-1.5 rounded-full px-4 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#0E9F8E] text-white shadow-sm hover:bg-[#0b7a6d]"
                  : "text-foreground hover:border-[#0E9F8E]/40 hover:text-[#0E9F8E]"
              }`}
            >
              {tab.dot && !isActive && (
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: tab.dot }}
                />
              )}
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  isActive ? "bg-white/20 text-white" : "bg-muted text-foreground"
                }`}
              >
                {count}
              </span>
            </Button>
          );
        })}
      </div>

      {/* ── Table + Detail Panel ── */}
      <div
        className={`flex gap-4 ${selectedNotification ? "items-start" : ""}`}
      >
        {/* Table */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow>
                  {["Thứ tự", "Loại", "Nội dung", "Chi tiết"].map((col, i) => (
                    <TableHead
                      key={col}
                      className={`${i === 3 ? "w-24 text-center" : ""} ${i === 0 ? "w-14" : ""} ${i === 1 ? "w-28" : ""}`}
                    >
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-14 text-center text-muted-foreground"
                    >
                      <Loader2 className="mx-auto size-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}

                {isError && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-14 text-center text-red-500">
                      {getErrorMessage(error, "Không thể tải thông báo.")}
                    </TableCell>
                  </TableRow>
                )}

                {!isPending &&
                  !isError &&
                  notificationList.map((n, i) => {
                    const badge = TYPE_BADGE[n.type] ?? FALLBACK_BADGE;
                    const isSelected = n.id === selectedId;
                    return (
                      <TableRow
                        key={n.id}
                        onClick={() => openDetail(n)}
                        className={`cursor-pointer border-b border-border-light last:border-0 transition-colors ${
                          isSelected ? "bg-primary-light" : "hover:bg-primary-soft"
                        }`}
                      >
                        {/* STT */}
                        <TableCell className="px-4 py-4 text-muted-foreground font-medium">
                          {String((page - 1) * PAGE_SIZE + i + 1).padStart(
                            2,
                            "0",
                          )}
                        </TableCell>

                        {/* Type badge */}
                        <TableCell className="px-4 py-4">
                          <span
                            className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${badge}`}
                          >
                            {TYPE_LABELS[n.type]}
                          </span>
                        </TableCell>

                        {/* Content */}
                        <TableCell className="px-4 py-4">
                          <div className="flex items-start gap-2">
                            <span
                              className="mt-1 size-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor: n.isRead
                                  ? "transparent"
                                  : "#F97316",
                              }}
                            />
                            <div>
                              <p
                                className={`leading-tight ${
                                  n.isRead
                                    ? "font-medium text-foreground"
                                    : "font-semibold text-foreground"
                                }`}
                              >
                                {n.title}
                              </p>
                              {n.subContent && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {n.subContent}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Detail link */}
                        <TableCell className="px-4 py-4 text-center">
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(n);
                            }}
                            className="h-auto w-auto p-0 text-sm font-medium text-[#0E9F8E]"
                          >
                            Xem →
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                {!isPending && !isError && notificationList.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-14 text-center text-muted-foreground"
                    >
                      Không có thông báo nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-1 border-t border-border-light px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-auto px-3 text-foreground"
              >
                Trước
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={p === page ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => setPage(p)}
                  className={`text-sm font-medium ${p === page ? "bg-[#0E9F8E] text-white hover:bg-[#0b7a6d]" : "text-foreground"}`}
                >
                  {p}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-auto px-3 text-foreground"
              >
                Sau
              </Button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedNotification && (
          <DetailPanel
            notification={selectedNotification}
            onClose={() => setSelectedId(null)}
            onMarkRead={(id) => markRead.mutate(id, markReadOptions)}
          />
        )}
      </div>

      <UsageGuides steps={USAGE_GUIDE_STEPS} warning={USAGE_GUIDE_WARNING} />
    </div>
  );
}
