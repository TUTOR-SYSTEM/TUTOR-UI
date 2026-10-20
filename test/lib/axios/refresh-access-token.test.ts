import { beforeEach, describe, expect, it, vi } from "vitest";

const postAuthRefresh = vi.hoisted(() => vi.fn());
vi.mock("@/lib/axios/auth-refresh", () => ({ postAuthRefresh }));

import { performRefresh, refreshAccessTokenViaStore } from "@/lib/axios/refresh-access-token";
import { useAuthStore } from "@/zustand/auth.store";

const initial = useAuthStore.getState();

const httpError = (status?: number) =>
  Object.assign(new Error("http"), {
    isAxiosError: true,
    response: status === undefined ? undefined : { status },
  });

describe("performRefresh", () => {
  beforeEach(() => {
    postAuthRefresh.mockReset();
    useAuthStore.setState({ ...initial, accessToken: "old-a", user: null }, false);
  });

  it("stores the new access token and keeps the profile on success", async () => {
    useAuthStore.setState({ user: { id: "u1" } as never }, false);
    postAuthRefresh.mockResolvedValue({ accessToken: "new-a" });

    await expect(performRefresh()).resolves.toBe("refreshed");

    expect(useAuthStore.getState().accessToken).toBe("new-a");
    expect(useAuthStore.getState().user).toEqual({ id: "u1" });
  });

  it("ends the session when the refresh cookie is rejected (401)", async () => {
    postAuthRefresh.mockRejectedValue(httpError(401));

    await expect(performRefresh()).resolves.toBe("rejected");
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("keeps the session on a network error or 5xx", async () => {
    postAuthRefresh.mockRejectedValue(httpError(undefined));
    await expect(performRefresh()).resolves.toBe("failed");
    expect(useAuthStore.getState().accessToken).toBe("old-a");

    postAuthRefresh.mockRejectedValue(httpError(503));
    await expect(performRefresh()).resolves.toBe("failed");
    expect(useAuthStore.getState().accessToken).toBe("old-a");
  });
});

describe("refreshAccessTokenViaStore", () => {
  beforeEach(() => {
    postAuthRefresh.mockReset();
    useAuthStore.setState({ ...initial, accessToken: "a" }, false);
  });

  it("shares one in-flight refresh between concurrent 401 callers", async () => {
    let resolve!: (v: { accessToken: string }) => void;
    postAuthRefresh.mockReturnValue(new Promise((r) => (resolve = r)));

    const first = refreshAccessTokenViaStore();
    const second = refreshAccessTokenViaStore();
    resolve({ accessToken: "a2" });

    await expect(Promise.all([first, second])).resolves.toEqual(["refreshed", "refreshed"]);
    expect(postAuthRefresh).toHaveBeenCalledTimes(1);
  });

  it("starts a new refresh once the previous one has settled", async () => {
    postAuthRefresh.mockResolvedValue({ accessToken: "a2" });
    await refreshAccessTokenViaStore();

    postAuthRefresh.mockResolvedValue({ accessToken: "a3" });
    await refreshAccessTokenViaStore();

    expect(postAuthRefresh).toHaveBeenCalledTimes(2);
  });
});
