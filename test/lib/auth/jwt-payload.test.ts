import { describe, expect, it } from "vitest";

import { decodeJwtPayload } from "@/lib/auth/jwt-payload";

/** base64url (no padding) JSON payload, the way a JWT encodes it. */
const b64url = (value: unknown) => {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

describe("decodeJwtPayload", () => {
  it("decodes base64url payloads that plain atob would reject", () => {
    // This payload encodes to a base64url segment containing '-' and '_' (not valid for atob).
    const claims = { sub: "u1", email: "a~~~@x.vn", role: "TUTOR" };
    const token = `h.${b64url(claims)}.s`;
    expect(token.split(".")[1]).toMatch(/[-_]/);
    expect(decodeJwtPayload<typeof claims>(token)).toEqual(claims);
  });

  it("decodes UTF-8 content (non-ASCII names/emails)", () => {
    const token = `h.${b64url({ sub: "u2", email: "nguyễn@trường.vn" })}.s`;
    expect(decodeJwtPayload<{ email: string }>(token)?.email).toBe("nguyễn@trường.vn");
  });

  it("returns null for a missing, empty or malformed token", () => {
    expect(decodeJwtPayload(null)).toBeNull();
    expect(decodeJwtPayload("no-dots")).toBeNull();
    expect(decodeJwtPayload("h.%%%.s")).toBeNull();
    expect(decodeJwtPayload(`h.${b64url("plain-string")}.s`)).toBe("plain-string");
  });
});
