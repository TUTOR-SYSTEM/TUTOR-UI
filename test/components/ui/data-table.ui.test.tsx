import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table.ui";
import { commonDictionary } from "@/lib/i18n/common.dictionary";

vi.mock("@/hooks/useCommonCopy.hook", async () => {
  const { commonDictionary: dict } = await import("@/lib/i18n/common.dictionary");
  return { useCommonCopy: () => ({ ...dict.vi, language: "vi", setLocale: vi.fn() }) };
});

type Row = { id: string; name: string };

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Name", render: (row) => row.name },
  { key: "index", header: "No.", render: (_row, index) => index + 1, width: "80px" },
];

const rows: Row[] = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
];

const copy = commonDictionary.vi.table;

describe("DataTable", () => {
  it("renders headers and one body row per data item", () => {
    render(<DataTable data={rows} columns={columns} rowKey={(row) => row.id} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("passes the row index to column render functions", () => {
    render(<DataTable data={rows} columns={columns} rowKey={(row) => row.id} />);
    const bodyRows = screen.getAllByRole("row").slice(1);
    expect(within(bodyRows[1]).getByText("2")).toBeInTheDocument();
  });

  it("renders a colgroup only when at least one column sets a width", () => {
    const { container, rerender } = render(
      <DataTable data={rows} columns={columns} rowKey={(row) => row.id} />,
    );
    expect(container.querySelector("colgroup")).toBeInTheDocument();
    expect(container.querySelectorAll("col")[1]).toHaveStyle({ width: "80px" });

    const noWidth = columns.map(({ width: _w, ...rest }) => rest);
    rerender(<DataTable data={rows} columns={noWidth} rowKey={(row) => row.id} />);
    expect(container.querySelector("colgroup")).not.toBeInTheDocument();
  });

  it("shows the default empty message when there is no data", () => {
    render(<DataTable data={[]} columns={columns} rowKey={(row) => row.id} />);
    expect(screen.getByText(copy.noData)).toBeInTheDocument();
  });

  it("uses a custom empty message when provided", () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        rowKey={(row) => row.id}
        emptyMessage="Nothing here"
      />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("shows a spinner and hides the empty message while loading", () => {
    const { container } = render(
      <DataTable data={[]} columns={columns} rowKey={(row) => row.id} isLoading />,
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText(copy.noData)).not.toBeInTheDocument();
  });

  it("shows the default error message on error and hides the empty message", () => {
    render(
      <DataTable data={[]} columns={columns} rowKey={(row) => row.id} isError />,
    );
    expect(screen.getByText(copy.loadError)).toBeInTheDocument();
    expect(screen.queryByText(copy.noData)).not.toBeInTheDocument();
  });

  it("uses a custom error message when provided", () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        rowKey={(row) => row.id}
        isError
        errorMessage="Boom"
      />,
    );
    expect(screen.getByText("Boom")).toBeInTheDocument();
  });

  it("applies rowClassName as a function of row and index", () => {
    render(
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(row) => row.id}
        rowClassName={(row, index) => `${row.id}-${index}`}
      />,
    );
    expect(screen.getByText("Alice").closest("tr")).toHaveClass("a-0");
    expect(screen.getByText("Bob").closest("tr")).toHaveClass("b-1");
  });
});
