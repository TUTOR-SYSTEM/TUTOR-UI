import { describe, expect, it } from "vitest";

import { isCompleteOtp, normalizeOtp, OTP_LENGTH } from "@/lib/auth/otp";

describe("normalizeOtp", () => {
  it("keeps digits only and caps the length at 6", () => {
    expect(normalizeOtp("48 29-31")).toBe("482931");
    expect(normalizeOtp("1234567890")).toBe("123456");
    expect(normalizeOtp("abc")).toBe("");
  });
});

describe("isCompleteOtp", () => {
  it("accepts exactly OTP_LENGTH digits", () => {
    expect(OTP_LENGTH).toBe(6);
    expect(isCompleteOtp("482931")).toBe(true);
  });

  it("rejects short, long, or non-digit codes", () => {
    expect(isCompleteOtp("12345")).toBe(false);
    expect(isCompleteOtp("1234567")).toBe(false);
    expect(isCompleteOtp("12a456")).toBe(false);
    expect(isCompleteOtp("")).toBe(false);
  });
});
