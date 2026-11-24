import { describe, expect, it } from "vitest";

import { createMustChangePasswordSchema } from "@/components/change-password/change-password-form";
import { changePasswordDictionary } from "@/lib/i18n/change-password.dictionary";

const schema = createMustChangePasswordSchema(changePasswordDictionary.vi.validation);

const valid = {
  currentPassword: "Old-Pass-123",
  newPassword: "New-Pass-456",
  confirmPassword: "New-Pass-456",
};

describe("createMustChangePasswordSchema", () => {
  it("accepts a compliant new password that differs from the current one", () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it("rejects a new password equal to the current one", () => {
    const result = schema.safeParse({
      currentPassword: "Same-Pass-1",
      newPassword: "Same-Pass-1",
      confirmPassword: "Same-Pass-1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["newPassword"],
          message: changePasswordDictionary.vi.validation.sameAsCurrent,
        }),
      );
    }
  });

  it.each([
    ["too short", "Ab1!"],
    ["too long", "Abcdefghijklmnopqrstu1!"],
    ["no uppercase", "new-pass-456"],
    ["no lowercase", "NEW-PASS-456"],
    ["no digit", "New-Pass-abc"],
    ["no special character", "NewPass456"],
  ])("rejects a new password that is %s", (_label, newPassword) => {
    expect(
      schema.safeParse({ currentPassword: "Old-Pass-123", newPassword, confirmPassword: newPassword })
        .success,
    ).toBe(false);
  });

  it("rejects a confirmation that does not match", () => {
    expect(schema.safeParse({ ...valid, confirmPassword: "Other-Pass-789" }).success).toBe(false);
  });
});
