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

  it("posts without a body, sends the httpOnly cookie, and returns only the access token", async () => {
    post.mockResolvedValue({ data: { data: { accessToken: "new-a" } } });

    await expect(postAuthRefresh()).resolves.toEqual({ accessToken: "new-a" });

    const [url, body, options] = post.mock.calls[0];
    expect(url).toMatch(/\/auth\/refresh$/);
    expect(body).toBeUndefined();
    expect(options.withCredentials).toBe(true);
    expect(options.headers.Authorization).toBeUndefined();
  });

  it("throws when the response has no access token", async () => {
    post.mockResolvedValue({ data: { data: {} } });
    await expect(postAuthRefresh()).rejects.toThrow("Invalid refresh response");
  });

  it("propagates transport errors", async () => {
    post.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(postAuthRefresh()).rejects.toThrow("ECONNREFUSED");
  });
});
