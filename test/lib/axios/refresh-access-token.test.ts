import { beforeEach, describe, expect, it, vi } from "vitest";

const postAuthRefresh = vi.hoisted(() => vi.fn());
vi.mock("@/lib/axios/auth-refresh", () => ({ postAuthRefresh }));

import { performRefresh, refreshAccessTokenViaStore } from "@/lib/axios/refresh-access-token";
import { getAccessToken, getRefreshToken } from "@/lib/axios/auth-storage";
import { useAuthStore } from "@/zustand/auth.store";

const initial = useAuthStore.getState();

describe("performRefresh", () => {
  beforeEach(() => {
    postAuthRefresh.mockReset();
    localStorage.clear();
    useAuthStore.setState({ ...initial, accessToken: "old-a", refreshToken: "old-r", user: null }, false);
  });

  it("stores rotated tokens in the store and in localStorage on success", async () => {
    postAuthRefresh.mockResolvedValue({ accessToken: "new-a", refreshToken: "new-r" });

    await expect(performRefresh()).resolves.toBe(true);

    expect(postAuthRefresh).toHaveBeenCalledWith("old-r");
    expect(useAuthStore.getState().accessToken).toBe("new-a");
    expect(useAuthStore.getState().refreshToken).toBe("new-r");
    expect(getAccessToken()).toBe("new-a");
    expect(getRefreshToken()).toBe("new-r");
  });

  it("clears auth and returns false when there is no refresh token", async () => {
    useAuthStore.setState({ refreshToken: null }, false);

    await expect(performRefresh()).resolves.toBe(false);
    expect(postAuthRefresh).not.toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("clears auth and returns false when the refresh call fails", async () => {
    postAuthRefresh.mockRejectedValue(new Error("401"));

    await expect(performRefresh()).resolves.toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });
});

describe("refreshAccessTokenViaStore", () => {
  beforeEach(() => {
    postAuthRefresh.mockReset();
    useAuthStore.setState({ ...initial, accessToken: "a", refreshToken: "r" }, false);
  });

  it("shares one in-flight refresh between concurrent 401 callers", async () => {
    let resolve!: (v: { accessToken: string; refreshToken: string }) => void;
    postAuthRefresh.mockReturnValue(new Promise((r) => (resolve = r)));

    const first = refreshAccessTokenViaStore();
    const second = refreshAccessTokenViaStore();
    resolve({ accessToken: "a2", refreshToken: "r2" });

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(postAuthRefresh).toHaveBeenCalledTimes(1);
  });

  it("starts a new refresh once the previous one has settled", async () => {
    postAuthRefresh.mockResolvedValue({ accessToken: "a2", refreshToken: "r2" });
    await refreshAccessTokenViaStore();

    postAuthRefresh.mockResolvedValue({ accessToken: "a3", refreshToken: "r3" });
    await refreshAccessTokenViaStore();

    expect(postAuthRefresh).toHaveBeenCalledTimes(2);
    expect(postAuthRefresh).toHaveBeenLastCalledWith("r2");
  });
});

describe("performRefresh failure modes", () => {
  beforeEach(() => {
    postAuthRefresh.mockReset();
    localStorage.clear();
    useAuthStore.setState({ ...initial, accessToken: "old-a", refreshToken: "old-r", user: null }, false);
  });

  it("keeps the session on a network error (refresh token may still be valid)", async () => {
    const networkError = Object.assign(new Error("Network Error"), {
      isAxiosError: true,
      response: undefined,
    });
    postAuthRefresh.mockRejectedValue(networkError);

    await expect(performRefresh()).resolves.toBe(false);

    expect(useAuthStore.getState().accessToken).toBe("old-a");
    expect(useAuthStore.getState().refreshToken).toBe("old-r");
  });

  it("ends the session when the refresh token is rejected with 401", async () => {
    const rejected = Object.assign(new Error("Unauthorized"), {
      isAxiosError: true,
      response: { status: 401 },
    });
    postAuthRefresh.mockRejectedValue(rejected);

    await expect(performRefresh()).resolves.toBe(false);

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
