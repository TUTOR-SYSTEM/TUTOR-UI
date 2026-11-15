import { describe, expect, it } from "vitest";

import { tutorsDictionary } from "@/lib/i18n/tutors.dictionary";
import { buildTutorCreateSchema, buildTutorEditSchema } from "@/lib/validation/tutor-form.schema";

const m = tutorsDictionary.vi.validation;

const valid = {
  lastName: "Trần",
  firstName: "Văn Khoa",
  email: "giasu@example.com",
  password: "Test@1234",
  phone: "",
  gender: "MALE" as const,
  subjects: [],
  school: "",
};

function firstMessage(data: Record<string, unknown>, field: string) {
  const result = buildTutorCreateSchema(m).safeParse({ ...valid, ...data });
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path[0] === field)?.message;
}

describe("buildTutorCreateSchema", () => {
  it("accepts a valid tutor", () => {
    expect(buildTutorCreateSchema(m).safeParse(valid).success).toBe(true);
  });

  it("requires last name and email", () => {
    expect(firstMessage({ lastName: "   " }, "lastName")).toBe(m.required);
    expect(firstMessage({ email: "" }, "email")).toBe(m.required);
    expect(firstMessage({ email: "not-an-email" }, "email")).toBe(m.emailInvalid);
  });

  it("enforces the 8–20 character password window", () => {
    expect(firstMessage({ password: "Ab1!" }, "password")).toBe(m.passwordMin);
    expect(firstMessage({ password: "Ab1!abcdefghijklmnopq" }, "password")).toBe(m.passwordMax);
    expect(firstMessage({ password: "Ab1!abcdefghij" }, "password")).toBeUndefined();
  });

  it("reports each missing password character class", () => {
    expect(firstMessage({ password: "abcdef1!" }, "password")).toBe(m.passwordUpper);
    expect(firstMessage({ password: "ABCDEF1!" }, "password")).toBe(m.passwordLower);
    expect(firstMessage({ password: "Abcdefg!" }, "password")).toBe(m.passwordDigit);
    expect(firstMessage({ password: "Abcdefg1" }, "password")).toBe(m.passwordSpecial);
  });

  it("edit schema has no password field", () => {
    const edit = buildTutorEditSchema(m).safeParse({
      lastName: "Trần",
      firstName: "Văn Khoa",
      email: "giasu@example.com",
      phone: "",
      school: "",
      subjects: [],
    });
    expect(edit.success).toBe(true);
  });
});
