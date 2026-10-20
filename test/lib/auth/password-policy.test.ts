import { describe, expect, it } from "vitest";

import { loginPasswordError, newPasswordError } from "@/lib/auth/password-policy";

const newMsgs = { tooShort: "short", tooLong: "long" };
const loginMsgs = { required: "required", tooLong: "long" };

describe("newPasswordError (create / reset: 8-100)", () => {
  it("accepts 8 to 100 characters", () => {
    expect(newPasswordError("12345678", newMsgs)).toBeNull();
    expect(newPasswordError("x".repeat(100), newMsgs)).toBeNull();
  });

  it("rejects under 8 and over 100 characters", () => {
    expect(newPasswordError("1234567", newMsgs)).toBe("short");
    expect(newPasswordError("", newMsgs)).toBe("short");
    expect(newPasswordError("x".repeat(101), newMsgs)).toBe("long");
  });
});

describe("loginPasswordError (login: no minimum)", () => {
  it("accepts short legacy passwords and rejects empty or over-100 values", () => {
    expect(loginPasswordError("123456", loginMsgs)).toBeNull();
    expect(loginPasswordError("", loginMsgs)).toBe("required");
    expect(loginPasswordError("x".repeat(101), loginMsgs)).toBe("long");
  });
});
