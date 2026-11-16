import { describe, expect, it } from "vitest";

import {
  loginPasswordError,
  newPasswordError,
} from "@/lib/auth/password-policy";

const newMsgs = { tooShort: "short", tooLong: "long", complexity: "complex" };
const loginMsgs = { required: "required", tooLong: "long" };

describe("newPasswordError (create / reset: 8-100 + complexity)", () => {
  it("accepts a valid password of 8 to 100 characters", () => {
    expect(newPasswordError("Abcdef1!", newMsgs)).toBeNull();
    expect(newPasswordError(`Aa1!${"x".repeat(96)}`, newMsgs)).toBeNull();
  });

  it("rejects under 8 and over 100 characters", () => {
    expect(newPasswordError("Abc1!ef", newMsgs)).toBe("short");
    expect(newPasswordError("", newMsgs)).toBe("short");
    expect(newPasswordError(`Aa1!${"x".repeat(97)}`, newMsgs)).toBe("long");
  });

  it("rejects passwords missing lowercase, uppercase, digit or special character", () => {
    expect(newPasswordError("abcdef1!", newMsgs)).toBe("complex");
    expect(newPasswordError("ABCDEF1!", newMsgs)).toBe("complex");
    expect(newPasswordError("Abcdefg!", newMsgs)).toBe("complex");
    expect(newPasswordError("Abcdefg1", newMsgs)).toBe("complex");
  });
});

describe("loginPasswordError (login: no minimum)", () => {
  it("accepts short legacy passwords and rejects empty or over-100 values", () => {
    expect(loginPasswordError("123456", loginMsgs)).toBeNull();
    expect(loginPasswordError("", loginMsgs)).toBe("required");
    expect(loginPasswordError("x".repeat(101), loginMsgs)).toBe("long");
  });
});
