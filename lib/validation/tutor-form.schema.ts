import { z } from "zod";

import type { TutorValidationMessages } from "@/lib/i18n/tutors.dictionary";

/** Must match the BE managed-account password rule (8–20 chars + complexity). */
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 20;

function nameField(m: TutorValidationMessages) {
  return z
    .string()
    .trim()
    .min(1, m.required)
    .min(2, m.nameMin)
    .max(100, m.nameMax);
}

function passwordField(m: TutorValidationMessages) {
  return z
    .string()
    .min(1, m.required)
    .min(PASSWORD_MIN, m.passwordMin)
    .max(PASSWORD_MAX, m.passwordMax)
    .superRefine((password, ctx) => {
      if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) return;
      const issue = (message: string) =>
        ctx.addIssue({ code: "custom", message, input: password });
      if (!/[a-z]/.test(password)) issue(m.passwordLower);
      if (!/[A-Z]/.test(password)) issue(m.passwordUpper);
      if (!/\d/.test(password)) issue(m.passwordDigit);
      if (!/[^A-Za-z0-9]/.test(password)) issue(m.passwordSpecial);
    });
}

/** Mật khẩu tùy chọn: để trống = BE tự sinh; nhập thì vẫn theo rule 8–20 + độ phức tạp. */
function optionalPasswordField(m: TutorValidationMessages) {
  return z.union([z.literal(""), passwordField(m)]);
}

/** Create-tutor form. Field names match the form values and the BE 422 `errors[].field`. */
export function buildTutorCreateSchema(m: TutorValidationMessages) {
  return z.object({
    lastName: nameField(m),
    firstName: nameField(m),
    email: z.string().trim().min(1, m.required).email(m.emailInvalid),
    password: optionalPasswordField(m),
    phone: z.string().trim().max(20, m.phoneMax),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    subjects: z.array(z.string()).min(1, m.subjectsRequired),
    school: z.string().trim().max(255, m.schoolMax),
  });
}

/** Admin đặt mật khẩu mới cho gia sư: cùng rule 8–20 với BE, kèm ô nhập lại khớp. */
export function buildTutorPasswordSchema(
  m: TutorValidationMessages,
  mismatchMessage: string,
) {
  return z
    .object({
      password: passwordField(m),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, {
      message: mismatchMessage,
      path: ["confirm"],
    });
}

/** Edit-tutor form (no password; gender is not editable here). */
export function buildTutorEditSchema(m: TutorValidationMessages) {
  return z.object({
    lastName: nameField(m),
    firstName: nameField(m),
    email: z.string().trim().min(1, m.required).email(m.emailInvalid),
    phone: z.string().trim().max(20, m.phoneMax),
    school: z.string().trim().max(255, m.schoolMax),
    subjects: z.array(z.string()),
  });
}
