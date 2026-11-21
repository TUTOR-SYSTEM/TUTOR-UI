import { describe, expect, it } from "vitest";

import { formatThousands, stripThousands } from "@/lib/format/money";

describe("money helpers", () => {
  it("groups thousands with dots", () => {
    expect(formatThousands("200000")).toBe("200.000");
    expect(formatThousands("1234567")).toBe("1.234.567");
    expect(formatThousands("999")).toBe("999");
    expect(formatThousands("")).toBe("");
  });

  it("strips separators and non-digits", () => {
    expect(stripThousands("1.234.567")).toBe("1234567");
    expect(stripThousands("12a3")).toBe("123");
  });
});
