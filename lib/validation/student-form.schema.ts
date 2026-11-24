import { z } from "zod";

import type { StudentValidationMessages } from "@/lib/i18n/students.dictionary";
import { newPasswordError } from "@/lib/auth/password-policy";
import { GENDER_ENUM } from "@/types";

/** Mật khẩu tùy chọn: để trống = BE tự sinh; nhập thì phải đạt chính sách 8–100, đủ 4 nhóm ký tự. */
function optionalPasswordIssue(value: string, m: StudentValidationMessages): string | null {
  if (value === "") return null;
  return newPasswordError(value, {
    tooShort: m.passwordTooShort,
    tooLong: m.passwordTooLong,
    complexity: m.passwordComplexity,
  });
}

/**
 * Add-student form. Field names match `FormValuesStudent` and the BE 422 `errors[].field`, so a
 * server error on any of these lands on the right input.
 */
export function buildStudentCreateSchema(
  m: StudentValidationMessages,
  options: { requireTutor?: boolean } = {},
) {
  const base = z.object({
    // Admin must pick the managing tutor (checked below); a TUTOR is assigned server-side.
    tutorId: z.string().optional(),
    studentName: z
      .string()
      .trim()
      .min(1, m.required)
      .min(2, m.nameMin)
      .max(255, m.nameMax),
    email: z
      .string()
      .trim()
      .min(1, m.required)
      .refine((v) => z.email().safeParse(v).success, { message: m.emailInvalid }),
    userCode: z.string().max(50, m.codeMax),
    classCode: z.string(),
    gender: z.nativeEnum(GENDER_ENUM),
    studentPhone: z.string().trim().max(20, m.phoneMax),
    school: z.string().trim().max(255, m.schoolMax),
    parentLastName: z.string().trim().min(1, m.required).max(255, m.nameMax),
    parentFirstName: z.string().trim().min(1, m.required).max(255, m.nameMax),
    parentPhone: z.string().trim().max(20, m.phoneMax),
    parentEmail: z
      .string()
      .trim()
      .refine((v) => v === "" || z.email().safeParse(v).success, { message: m.emailInvalid }),
    // default "" → output luôn là string (khớp FormValuesStudent); input thiếu vẫn hợp lệ.
    password: z.string().default(""),
  });
  return base.superRefine((values, ctx) => {
    if (options.requireTutor && !values.tutorId) {
      ctx.addIssue({ code: "custom", path: ["tutorId"], message: m.tutorRequired });
    }
    const studentIssue = optionalPasswordIssue(values.password ?? "", m);
    if (studentIssue) ctx.addIssue({ code: "custom", path: ["password"], message: studentIssue });
  });
}
