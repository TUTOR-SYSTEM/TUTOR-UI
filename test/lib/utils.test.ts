import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";
import { isImageFile } from "@/lib/file-utils";
import { BANK_INFO } from "@/lib/bank-info";
import { SUBJECT_OPTIONS } from "@/lib/subjects";

describe("cn", () => {
  it("joins class names and drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("resolves conflicting tailwind utilities, keeping the last", () => {
    expect(cn("p-2 text-sm", "p-4")).toBe("text-sm p-4");
  });

  it("supports conditional object syntax", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });
});

describe("isImageFile", () => {
  it("recognises common image extensions case-insensitively", () => {
    expect(isImageFile("avatar.PNG")).toBe(true);
    expect(isImageFile("photo.jpeg")).toBe(true);
    expect(isImageFile("logo.svg")).toBe(true);
  });

  it("rejects non-image and extensionless names", () => {
    expect(isImageFile("report.pdf")).toBe(false);
    expect(isImageFile("README")).toBe(false);
    expect(isImageFile("archive.png.zip")).toBe(false);
  });
});

describe("static config modules", () => {
  it("has unique subject options", () => {
    expect(new Set(SUBJECT_OPTIONS).size).toBe(SUBJECT_OPTIONS.length);
  });

  it("exposes complete bank info for the settings page", () => {
    expect(BANK_INFO.vietqrBankId).toBeTruthy();
    expect(BANK_INFO.accountNo).toMatch(/^\d+$/);
  });
});
