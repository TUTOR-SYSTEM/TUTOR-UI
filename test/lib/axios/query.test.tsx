import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@/lib/axios", () => ({ axiosInstance: http }));

import { apiPost, useGet, usePatch, usePost } from "@/lib/axios/query";

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe("apiPost", () => {
  beforeEach(() => {
    Object.values(http).forEach((fn) => fn.mockReset());
  });

  it("sends an object payload as the JSON body", async () => {
    http.post.mockResolvedValue({ data: { ok: true } });
    await expect(apiPost("/classes", { name: "A" })).resolves.toEqual({ ok: true });
    expect(http.post).toHaveBeenCalledWith("/classes", { name: "A" });
  });

  it("does not send a bare string payload as the body (it is only a URL param)", async () => {
    http.post.mockResolvedValue({ data: {} });
    await apiPost("/sessions/abc/run", "abc");
    expect(http.post).toHaveBeenCalledWith("/sessions/abc/run", undefined);
  });
});

describe("useGet", () => {
  beforeEach(() => {
    Object.values(http).forEach((fn) => fn.mockReset());
  });

  it("forwards params and applies select to the response", async () => {
    http.get.mockResolvedValue({ data: { items: [1, 2, 3] } });

    const { result } = renderHook(
      () =>
        useGet<{ items: number[] }, number>(["k"], "/items", {
          params: { page: 1 },
          select: (raw) => raw.items.length,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(http.get).toHaveBeenCalledWith("/items", { params: { page: 1 } });
    expect(result.current.data).toBe(3);
  });
});

describe("usePost / usePatch", () => {
  beforeEach(() => {
    Object.values(http).forEach((fn) => fn.mockReset());
  });

  it("resolves a dynamic URL from the payload", async () => {
    http.post.mockResolvedValue({ data: { id: "x" } });

    const { result } = renderHook(
      () => usePost<{ id: string }, { id: string }>((p) => `/things/${p.id}/publish`),
      { wrapper },
    );

    await result.current.mutateAsync({ id: "7" });
    expect(http.post).toHaveBeenCalledWith("/things/7/publish", { id: "7" });
  });

  it("uses PATCH for usePatch", async () => {
    http.patch.mockResolvedValue({ data: { ok: 1 } });

    const { result } = renderHook(() => usePatch<{ ok: number }, { name: string }>("/me"), { wrapper });
    await result.current.mutateAsync({ name: "n" });

    expect(http.patch).toHaveBeenCalledWith("/me", { name: "n" });
  });
});
