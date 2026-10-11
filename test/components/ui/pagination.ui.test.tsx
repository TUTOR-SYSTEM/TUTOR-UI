import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "@/components/ui/pagination.ui";
import { commonDictionary } from "@/lib/i18n/common.dictionary";

const copy = commonDictionary.vi.pagination;

vi.mock("@/hooks/useCommonCopy.hook", async () => {
  const { commonDictionary: dict } = await import("@/lib/i18n/common.dictionary");
  return { useCommonCopy: () => ({ ...dict.vi, language: "vi", setLocale: vi.fn() }) };
});

describe("Pagination", () => {
  it("renders one button per page and marks the current page", () => {
    render(<Pagination page={2} totalPages={3} onPageChange={vi.fn()} />);
    const pageButton = screen.getByRole("button", { name: "2" });
    expect(pageButton.className).toContain("bg-[#0E9F8E]!");
    expect(screen.getByRole("button", { name: "1" }).className).not.toContain("bg-[#0E9F8E]!");
  });

  it("calls onPageChange with the clicked page number", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("goes to the previous and next page via the arrow buttons", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={3} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByLabelText(copy.previous));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByLabelText(copy.next));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
  });

  it("disables previous on the first page and next on the last page", () => {
    const { rerender } = render(
      <Pagination page={1} totalPages={2} onPageChange={vi.fn()} />,
    );
    expect(screen.getByLabelText(copy.previous)).toBeDisabled();
    expect(screen.getByLabelText(copy.next)).not.toBeDisabled();

    rerender(<Pagination page={2} totalPages={2} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText(copy.previous)).not.toBeDisabled();
    expect(screen.getByLabelText(copy.next)).toBeDisabled();
  });

  it("does not render a page-size selector without onPageSizeChange", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(screen.queryByText(copy.rowsPerPage)).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="pagination"]')).toBeInTheDocument();
  });

  it("renders the rows-per-page label when onPageSizeChange is provided", () => {
    render(
      <Pagination
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
        pageSize={20}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByText(copy.rowsPerPage)).toBeInTheDocument();
  });
});
