import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

  it("creates, then deletes, a case through the dialogs without network", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TestMonitorPage />
      </QueryClientProvider>,
    );
    const endpoints = Number(screen.getByText(/endpoint · 26 test case/).textContent!.split(" ")[0]);

    fireEvent.click(screen.getByRole("button", { name: copy.page.createCase }));
    fireEvent.change(screen.getByLabelText(copy.editor.fields.path), { target: { value: "/health" } });
    fireEvent.change(screen.getByLabelText(copy.editor.fields.name), { target: { value: "Ping" } });
    fireEvent.click(screen.getByRole("button", { name: copy.editor.submitCreate }));

    await waitFor(() => expect(screen.getByText(new RegExp(`^${copy.page.subtitle(endpoints + 1, 27)}`))).toBeInTheDocument());
    expect(screen.queryByRole("dialog", { name: copy.editor.titleCreate })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("/health").closest("tr")!);
    fireEvent.click(screen.getByRole("button", { name: copy.list.actions.menu("Ping") }));
    fireEvent.click(screen.getByRole("button", { name: copy.list.actions.delete }));
    fireEvent.click(screen.getByRole("button", { name: copy.deleteDialog.confirm }));

    await waitFor(() => expect(screen.getByText(new RegExp(`^${copy.page.subtitle(endpoints, 26)}`))).toBeInTheDocument());
  });

  it("keeps the form open and flags fields the gateway would reject", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TestMonitorPage />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: copy.page.createCase }));
    fireEvent.change(screen.getByLabelText(copy.editor.fields.body), { target: { value: "{bad" } });
    fireEvent.click(screen.getByRole("button", { name: copy.editor.submitCreate }));

    expect(screen.getByText(copy.editor.errors.required)).toBeInTheDocument();
    expect(screen.getByText(copy.editor.errors.json)).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: copy.editor.titleCreate })).toBeInTheDocument();
  });

  it("manages fixtures and shows which test accounts are configured", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TestMonitorPage />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: copy.page.fixturesButton }));
    expect(screen.getByText("classId")).toBeInTheDocument();
    expect(screen.getByText(copy.fixtures.accountMissing("TEST_ACCOUNT_PARENT"))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: copy.fixtures.add }));
    fireEvent.click(screen.getByRole("radio", { name: copy.fixtureEditor.fields.modeValue }));
    fireEvent.change(screen.getByLabelText(copy.fixtureEditor.fields.key), { target: { value: "lessonId" } });
    fireEvent.change(screen.getByLabelText(copy.fixtureEditor.fields.value), { target: { value: "L-9" } });
    fireEvent.click(screen.getByRole("button", { name: copy.fixtureEditor.submit }));

    await waitFor(() => expect(screen.getByText("lessonId")).toBeInTheDocument());
    expect(screen.getByText("L-9")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: copy.fixtures.delete("lessonId") }));
    fireEvent.click(screen.getByRole("button", { name: copy.fixtureDelete.confirm }));
    await waitFor(() => expect(screen.queryByText("lessonId")).not.toBeInTheDocument());
  });

  it("marks unconfigured auth profiles in the case form", () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TestMonitorPage />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: copy.page.createCase }));
    fireEvent.click(screen.getByText(copy.authProfiles.label.caller));
    expect(
      screen.getByText(`${copy.authProfiles.label.parent} (${copy.authProfiles.notConfigured})`),
    ).toBeInTheDocument();
  });

  it("fills a coverage gap through the generator", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <TestMonitorPage />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: copy.page.tabs.coverage }));
    // GET and DELETE share the path; take the GET row.
    const getDetailRow = () =>
      screen
        .getAllByText("/classes/:id")
        .map((el) => el.closest("tr")!)
        .find((tr) => within(tr).queryByText("GET"))!;
    const detailRow = getDetailRow();
    expect(within(detailRow).getAllByRole("button", { name: /Thiếu/ }).length).toBeGreaterThan(0);

    fireEvent.click(within(detailRow).getByRole("button", { name: copy.coverage.generateMissingFor("/classes/:id") }));
    fireEvent.click(screen.getByRole("button", { name: copy.generator.preview }));
    await waitFor(() => expect(screen.getByText("UUID không tồn tại")).toBeInTheDocument());
    expect(screen.getByText("{{fixture.classId}}")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Lưu \d+ case$/ }));
    await waitFor(() =>
      expect(within(getDetailRow()).queryByRole("button", { name: /Thiếu/ })).toBeNull(),
    );
  });
});
