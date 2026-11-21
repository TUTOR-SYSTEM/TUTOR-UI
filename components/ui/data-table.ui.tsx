"use client";

import type { Key, ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.ui";

/** Căn ngang của cột (áp dụng cho cả header và cell). Mặc định `left`. */
export type DataTableAlign = "left" | "center" | "right";

const ALIGN_CLASS: Record<DataTableAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  width?: string | number;
  /** Dùng `center` cho cột trạng thái / thao tác. */
  align?: DataTableAlign;
};

export type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T, index: number) => Key;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: ReactNode;
  emptyMessage?: ReactNode;
  headerRowClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  className?: string;
  pageSize?: number;
};

function DataTable<T>({
  data,
  columns,
  rowKey,
  isLoading = false,
  isError = false,
  errorMessage,
  emptyMessage,
  headerRowClassName,
  rowClassName,
  className,
}: DataTableProps<T>) {
  const { table } = useCommonCopy();
  const resolvedErrorMessage = errorMessage ?? table.loadError;
  const resolvedEmptyMessage = emptyMessage ?? table.noData;

  const hasColumnWidths = columns.some((col) => col.width !== undefined);

  return (
    <Table className={className}>
      {hasColumnWidths && (
        <colgroup>
          {columns.map((col) => (
            <col key={col.key} style={{ width: col.width }} />
          ))}
        </colgroup>
      )}
      <TableHeader>
        <TableRow className={headerRowClassName}>
          {columns.map((col) => (
            <TableHead
              key={col.key}
              className={cn(ALIGN_CLASS[col.align ?? "left"], col.headerClassName)}
            >
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow
            key={rowKey(row, index)}
            className={
              typeof rowClassName === "function"
                ? rowClassName(row, index)
                : rowClassName
            }
          >
            {columns.map((col) => (
              <TableCell
                key={col.key}
                className={cn(ALIGN_CLASS[col.align ?? "left"], col.cellClassName)}
              >
                {col.render(row, index)}
              </TableCell>
            ))}
          </TableRow>
        ))}

        {!isLoading && !isError && data.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="py-14 text-center text-muted-foreground"
            >
              {resolvedEmptyMessage}
            </TableCell>
          </TableRow>
        )}
        {isLoading && (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="py-14 text-center text-muted-foreground"
            >
              <Loader2 className="mx-auto size-5 animate-spin" />
            </TableCell>
          </TableRow>
        )}
        {isError && (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="py-14 text-center text-red-500"
            >
              {resolvedErrorMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export { DataTable };
