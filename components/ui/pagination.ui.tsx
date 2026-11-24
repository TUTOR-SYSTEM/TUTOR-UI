"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button.ui";
import { Select } from "@/components/ui/select.ui";
import { useCommonCopy } from "@/hooks/useCommonCopy.hook";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

function Pagination({
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
}: PaginationProps) {
  const { pagination: paginationCopy } = useCommonCopy();

  return (
    <div
      data-slot="pagination"
      className={cn("flex items-center justify-between gap-3", className)}
    >
      {onPageSizeChange ? (
        <div className="flex items-center gap-2 text-sm text-[#16302b] dark:text-foreground">
          <span className="whitespace-nowrap text-[#8AA09B] dark:text-muted-foreground">
            {paginationCopy.rowsPerPage}
          </span>
          <Select
            value={String(pageSize ?? pageSizeOptions[0])}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            options={pageSizeOptions.map((size) => ({
              label: String(size),
              value: String(size),
            }))}
            className="h-9! w-20!"
          />
        </div>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label={paginationCopy.previous}
          className="size-8! rounded-lg text-[#16302b] dark:text-foreground hover:bg-[#F3F7F5] dark:hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Button
            key={p}
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onPageChange(p)}
            className={cn(
              "size-8! rounded-lg text-sm font-medium hover:bg-[#F3F7F5] dark:hover:bg-muted",
              p === page
                ? "bg-[#0E9F8E]! text-white hover:bg-[#0E9F8E]!"
                : "text-[#16302b] dark:text-foreground",
            )}
          >
            {p}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label={paginationCopy.next}
          className="size-8! rounded-lg text-[#16302b] dark:text-foreground hover:bg-[#F3F7F5] dark:hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export { Pagination };
