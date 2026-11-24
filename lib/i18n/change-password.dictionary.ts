import type { Language } from "@/types";

type ChangePasswordValidation = {
  currentRequired: string;
  min: string;
  max: string;
  upper: string;
  lower: string;
  digit: string;
  special: string;
  confirmRequired: string;
  mismatch: string;
  sameAsCurrent: string;
};

export type ChangePasswordDictionary = {
  title: string;
  description: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordHint: string;
  submit: string;
  submitting: string;
  success: string;
  validation: ChangePasswordValidation;
};

export const changePasswordDictionary: Record<Language, ChangePasswordDictionary> = {
  vi: {
  title: "Đổi mật khẩu để tiếp tục",
  description: "Đây là lần đăng nhập đầu tiên của bạn, hoặc mật khẩu vừa được quản trị viên đặt. Vui lòng chọn mật khẩu mới trước khi sử dụng hệ thống.",
  currentPassword: "Mật khẩu hiện tại",
  newPassword: "Mật khẩu mới",
  confirmPassword: "Xác nhận mật khẩu mới",
  passwordHint: "8–20 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.",
  submit: "Đổi mật khẩu",
  submitting: "Đang lưu...",
  success: "Đã đổi mật khẩu thành công!",
  validation: {
    currentRequired: "Vui lòng nhập mật khẩu hiện tại",
    min: "Tối thiểu 8 ký tự",
    max: "Tối đa 20 ký tự",
    upper: "Phải có ít nhất 1 chữ hoa",
    lower: "Phải có ít nhất 1 chữ thường",
    digit: "Phải có ít nhất 1 chữ số",
    special: "Phải có ít nhất 1 ký tự đặc biệt",
    confirmRequired: "Vui lòng xác nhận mật khẩu",
    mismatch: "Mật khẩu xác nhận không khớp",
    sameAsCurrent: "Mật khẩu mới phải khác mật khẩu hiện tại"
  }
},
  en: {
  title: "Change your password to continue",
  description: "This is your first sign-in, or your password was just set by an administrator. Please choose a new password before using the system.",
  currentPassword: "Current password",
  newPassword: "New password",
  confirmPassword: "Confirm new password",
  passwordHint: "8–20 characters, including uppercase, lowercase, a digit and a special character.",
  submit: "Change password",
  submitting: "Saving...",
  success: "Password changed successfully!",
  validation: {
    currentRequired: "Please enter your current password",
    min: "At least 8 characters",
    max: "At most 20 characters",
    upper: "Must contain at least 1 uppercase letter",
    lower: "Must contain at least 1 lowercase letter",
    digit: "Must contain at least 1 digit",
    special: "Must contain at least 1 special character",
    confirmRequired: "Please confirm your password",
    mismatch: "Passwords do not match",
    sameAsCurrent: "New password must be different from the current password"
  }
},
};
