import { describe, expect, it } from "vitest";

import {
  ALL_ROLES,
  isRoleAllowed,
  ROLE_HOME,
  ROLE_LABELS,
} from "@/lib/rbac/roles";

describe("rbac roles", () => {
  it("lists every role exactly once", () => {
    expect([...ALL_ROLES].sort()).toEqual(["ADMIN", "PARENT", "STUDENT", "TUTOR"]);
  });

  it("has a Vietnamese label and a home route for every role", () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_LABELS[role]).toBeTruthy();
      expect(ROLE_HOME[role]).toBe("/");
    }
  });

  it("isRoleAllowed checks membership in the allow-list", () => {
    expect(isRoleAllowed("TUTOR", ["ADMIN", "TUTOR"])).toBe(true);
    expect(isRoleAllowed("PARENT", ["ADMIN", "TUTOR"])).toBe(false);
    expect(isRoleAllowed("ADMIN", [])).toBe(false);
  });
});
