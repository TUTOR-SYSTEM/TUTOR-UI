import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { TestMonitorPage } from "@/components/test-monitor/test-monitor-page";
import { testMonitorDictionary } from "@/lib/i18n/test-monitor.dictionary";

vi.mock("@/hooks/useTestMonitorMock.hook", () => ({ useTestMonitorMock: () => true }));
vi.mock("@/hooks/useLocale.hook", () => ({
  useLocale: () => ({ language: "vi", setLocale: vi.fn() }),
}));
vi.mock("@/hooks/useLogSocket.hook", () => ({ useLogSocket: vi.fn() }));

const copy = testMonitorDictionary.vi;

describe("TestMonitorPage (mock mode)", () => {
  it("renders demo data with a demo badge and runs a case without network", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TestMonitorPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText(copy.page.demoBadge)).toBeInTheDocument();
    expect(screen.getByText("/users/profile")).toBeInTheDocument();
    expect(screen.getByText("/classes/members")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${copy.page.runAll(26).slice(0, 10)}`) }));
    await waitFor(() => expect(screen.getByText(/Đang chạy 1\/26/)).toBeInTheDocument());
  });
});
