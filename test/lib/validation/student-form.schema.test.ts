import { describe, expect, it } from "vitest";

import { studentsDictionary } from "@/lib/i18n/students.dictionary";
import { buildStudentCreateSchema } from "@/lib/validation/student-form.schema";
import { GENDER_ENUM } from "@/types";

const m = studentsDictionary.vi.validation;

const valid = {
  studentName: "Trần Văn Khoa",
  userCode: "CWEOA8",
  classCode: "",
  gender: GENDER_ENUM.MALE,
  studentPhone: "",
  school: "",
  parentName: "Trần Văn Hùng",
  parentRelationship: "FATHER",
  parentPhone: "",
  parentEmail: "",
};

function messageFor(overrides: Record<string, unknown>, field: string) {
  const result = buildStudentCreateSchema(m).safeParse({ ...valid, ...overrides });
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path[0] === field)?.message;
}

describe("buildStudentCreateSchema", () => {
  it("accepts a complete student with a parent", () => {
    expect(buildStudentCreateSchema(m).safeParse(valid).success).toBe(true);
  });

  it("requires the student name and the parent name", () => {
    expect(messageFor({ studentName: "   " }, "studentName")).toBe(m.required);
    expect(messageFor({ studentName: "A" }, "studentName")).toBe(m.nameMin);
    expect(messageFor({ parentName: "" }, "parentName")).toBe(m.required);
  });

  it("treats the parent email as optional but validates it when given", () => {
    expect(messageFor({ parentEmail: "" }, "parentEmail")).toBeUndefined();
    expect(messageFor({ parentEmail: "phuhuynh@gmail.com" }, "parentEmail")).toBeUndefined();
    expect(messageFor({ parentEmail: "not-an-email" }, "parentEmail")).toBe(m.emailInvalid);
  });

  it("limits phone length", () => {
    expect(messageFor({ studentPhone: "1".repeat(21) }, "studentPhone")).toBe(m.phoneMax);
  });
});
