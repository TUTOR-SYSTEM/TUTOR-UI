import { describe, expect, it } from "vitest";

import { resolveLoginUrl } from "@/types/auth.types";

describe("resolveLoginUrl", () => {
  it("uses the user-code endpoint when the payload carries a userCode", () => {
    expect(resolveLoginUrl({ userCode: "STU001", password: "x" } as never)).toBe("/auth/login/user-code");
  });

  it("uses the email/identifier endpoint otherwise", () => {
    expect(resolveLoginUrl({ email: "a@b.c", password: "x" } as never)).toBe("/auth/login");
  });
});
