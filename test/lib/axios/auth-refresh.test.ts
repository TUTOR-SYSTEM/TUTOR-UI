import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.hoisted(() => vi.fn());
vi.mock("axios", () => ({ default: { post } }));

import { postAuthRefresh, unwrapNestPayload } from "@/lib/axios/auth-refresh";

describe("unwrapNestPayload", () => {
  it("returns the inner `data` object when wrapped", () => {
    expect(unwrapNestPayload({ data: { accessToken: "a" } })).toEqual({ accessToken: "a" });
  });

  it("returns the body itself when unwrapped, and undefined for non-objects", () => {
    expect(unwrapNestPayload({ accessToken: "a" })).toEqual({ accessToken: "a" });
    expect(unwrapNestPayload(null)).toBeUndefined();
    expect(unwrapNestPayload("x")).toBeUndefined();
  });
});

describe("postAuthRefresh", () => {
  beforeEach(() => {
    post.mockReset();
  });

  it("posts the refresh token without the Bearer header and returns both tokens", async () => {
    post.mockResolvedValue({ data: { data: { accessToken: "new-a", refreshToken: "new-r" } } });

    await expect(postAuthRefresh("old-r")).resolves.toEqual({
      accessToken: "new-a",
      refreshToken: "new-r",
    });

    const [url, body, options] = post.mock.calls[0];
    expect(url).toMatch(/\/auth\/refresh$/);
    expect(body).toEqual({ refreshToken: "old-r" });
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(options.headers.Authorization).toBeUndefined();
  });

  it("throws when the response is missing either token", async () => {
    post.mockResolvedValue({ data: { data: { accessToken: "only-a" } } });
    await expect(postAuthRefresh("r")).rejects.toThrow("Invalid refresh response");
  });

  it("propagates transport errors", async () => {
    post.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(postAuthRefresh("r")).rejects.toThrow("ECONNREFUSED");
  });
});
