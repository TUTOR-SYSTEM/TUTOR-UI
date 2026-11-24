import type { Language } from "@/types";

export type UsersDictionary = {
  createDialog: {
    passwordLabel: string;
    passwordHint: string;
    passwordPlaceholder: string;
    passwordTooShort: string;
    passwordTooLong: string;
  };
};

const vi: UsersDictionary = {
  createDialog: {
    passwordLabel: "Mật khẩu (tuỳ chọn)",
    passwordHint:
      "Để trống, hệ thống sẽ tự tạo mật khẩu ngẫu nhiên đáp ứng quy tắc bảo mật và gửi qua email (nếu có).",
    passwordPlaceholder: "8–20 ký tự",
    passwordTooShort: "Mật khẩu phải có ít nhất 8 ký tự",
    passwordTooLong: "Mật khẩu tối đa 20 ký tự",
  },
};

const en: UsersDictionary = {
  createDialog: {
    passwordLabel: "Password (optional)",
    passwordHint:
      "Leave empty and the system will generate a random password that meets the security rules and send it by email (if an email is provided).",
    passwordPlaceholder: "8–20 characters",
    passwordTooShort: "Password must be at least 8 characters",
    passwordTooLong: "Password must be at most 20 characters",
  },
};

export const usersDictionary: Record<Language, UsersDictionary> = { vi, en };
