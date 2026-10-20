import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { apiPut } from "@/lib/axios/query";
import { useUpdateTutorById } from "@/hooks/useAdminUsers.hook";

vi.mock("@/lib/axios/query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/axios/query")>();
  return { ...actual, apiPut: vi.fn() };
});

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useUpdateTutorById", () => {
  beforeEach(() => {
    vi.mocked(apiPut).mockResolvedValue({ data: {} });
  });

  it("puts to /admin/tutors/:id with the id only in the URL, not the body", async () => {
    const { result } = renderHook(() => useUpdateTutorById(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "88914f87-93e3-4463-8898-3f12c9e4232f",
        subjects: ["Toán", "Vật lý", "Hóa học"],
      });
    });

    expect(apiPut).toHaveBeenCalledWith(
      "/admin/tutors/88914f87-93e3-4463-8898-3f12c9e4232f",
      { subjects: ["Toán", "Vật lý", "Hóa học"] },
    );
  });
});
