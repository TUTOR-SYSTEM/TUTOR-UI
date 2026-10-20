import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { consumeOAuthAttempt, markOAuthAttempt } from "@/lib/oauth";

describe("OAuth attempt marker (login CSRF guard)", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it("rejects a callback when this tab never started an OAuth flow", () => {
    expect(consumeOAuthAttempt()).toBe(false);
  });

  it("accepts exactly one callback after a start, then forgets the marker", () => {
    markOAuthAttempt(1_000);
    expect(consumeOAuthAttempt(1_500)).toBe(true);
    expect(consumeOAuthAttempt(1_500)).toBe(false);
  });

  it("rejects a marker older than the 10 minute TTL", () => {
    markOAuthAttempt(0);
    expect(consumeOAuthAttempt(10 * 60 * 1000 + 1)).toBe(false);
  });
});
