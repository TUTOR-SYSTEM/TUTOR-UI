"use client";

import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, FileText, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StudentSessionListItem } from "@/types/session.types";
import {
  SESSION_STATUS_META,
  StatusBadge,
  fmtDate,
  fmtTime,
} from "./session-shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.ui";

export const StudentSessionsTable = ({
  sessions,
}: {
  sessions: StudentSessionListItem[];
}) => {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
      <Table className="w-full min-w-[720px] border-collapse text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="px-4">Buổi</TableHead>
            <TableHead className="px-4">Tiêu đề</TableHead>
            <TableHead className="px-4">Lớp</TableHead>
            <TableHead className="px-4">Thời gian</TableHead>
            <TableHead className="px-4">Địa điểm</TableHead>
            <TableHead className="px-4">Tài liệu</TableHead>
            <TableHead className="px-4 text-center">Trạng thái</TableHead>
            <TableHead className="px-4 text-center" aria-label="Xem chi tiết" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((s) => {
            const meta = SESSION_STATUS_META[s.status];
            const materials = s.theoryUrls.length + s.exerciseUrls.length;

            return (
              <TableRow
                key={s.id}
                onClick={() => router.push(`/sessions/${s.id}`)}
                className="group cursor-pointer border-b border-border/40 transition-colors last:border-0 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10"
              >
                <TableCell className="px-4 py-3">
                  <span className="inline-flex size-9 flex-col items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <span className="text-sm font-semibold leading-none tabular-nums">
                      {String(s.sessionNumber).padStart(2, "0")}
                    </span>
                  </span>
                </TableCell>

                <TableCell className="max-w-[220px] px-4 py-3">
                  <p className="truncate font-medium">
                    {s.title || `Buổi học ${s.sessionNumber}`}
                  </p>
                </TableCell>

                <TableCell className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <BookOpen className="size-3.5 shrink-0" />
                    <span className="truncate">{s.class.name}</span>
                    <span className="font-mono text-xs">({s.class.code})</span>
                  </span>
                </TableCell>

                <TableCell className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {fmtDate(s.startAt)}
                  {fmtTime(s.startAt) ? ` · ${fmtTime(s.startAt)}` : ""}
                </TableCell>

                <TableCell className="max-w-[180px] px-4 py-3 text-muted-foreground">
                  {s.location ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{s.location}</span>
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>

                <TableCell className="px-4 py-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="size-3.5" />
                    {materials}
                  </span>
                </TableCell>

                <TableCell className="px-4 py-3 text-center">
                  <StatusBadge label={meta.label} className={meta.className} />
                </TableCell>

                <TableCell className="px-4 py-3 text-center">
                  <ChevronRight
                    className={cn(
                      "inline size-4 text-muted-foreground transition-transform",
                      "group-hover:translate-x-0.5 group-hover:text-emerald-600",
                    )}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
