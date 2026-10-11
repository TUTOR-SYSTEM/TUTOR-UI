import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = vi.hoisted(() => ({ get: vi.fn() }));
const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));
vi.mock("next/navigation", () => ({ redirect }));

import { redirectIfAuthenticated } from "@/lib/axios/auth-redirect";

describe("redirectIfAuthenticated", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    redirect.mockReset();
  });

  it("redirects to / by default when an access_token cookie exists", async () => {
    cookieStore.get.mockImplementation((name: string) =>
      name === "access_token" ? { value: "t" } : undefined,
    );
    await redirectIfAuthenticated();
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("accepts the camelCase accessToken cookie too", async () => {
    cookieStore.get.mockImplementation((name: string) =>
      name === "accessToken" ? { value: "t" } : undefined,
    );
    await redirectIfAuthenticated("/dashboard");
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("does nothing for anonymous visitors", async () => {
    cookieStore.get.mockReturnValue(undefined);
    await redirectIfAuthenticated();
    expect(redirect).not.toHaveBeenCalled();
  });
});
