import { describe, expect, it } from "vitest";

import { safeRedirectHref } from "@/lib/notification-redirect";

describe("safeRedirectHref", () => {
  it("allows internal paths and https links", () => {
    expect(safeRedirectHref("/classes/123")).toBe("/classes/123");
    expect(safeRedirectHref("https://example.com/a")).toBe("https://example.com/a");
  });

  it("rejects protocol-relative, backslash, whitespace/control and non-https targets", () => {
    expect(safeRedirectHref("//evil.com")).toBeNull();
    expect(safeRedirectHref("/\\evil.com")).toBeNull();
    expect(safeRedirectHref("/\t/evil.com")).toBeNull();
    expect(safeRedirectHref("/\n/evil.com")).toBeNull();
    expect(safeRedirectHref("javascript:alert(1)")).toBeNull();
    expect(safeRedirectHref("http://example.com")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(safeRedirectHref(null)).toBeNull();
    expect(safeRedirectHref("")).toBeNull();
  });
});
