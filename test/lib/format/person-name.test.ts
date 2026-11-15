import { describe, expect, it } from "vitest";

import { formatPersonName } from "@/lib/format/person-name";

describe("formatPersonName", () => {
  it("puts last name first for Vietnamese (Họ Tên)", () => {
    expect(formatPersonName("Văn Khoa", "Trần", "vi")).toBe("Trần Văn Khoa");
  });

  it("puts first name first for English", () => {
    expect(formatPersonName("Khoa", "Tran", "en")).toBe("Khoa Tran");
  });

  it("drops empty parts and returns an empty string when both are missing", () => {
    expect(formatPersonName(" ", "Trần", "vi")).toBe("Trần");
    expect(formatPersonName(null, undefined, "vi")).toBe("");
  });
});
