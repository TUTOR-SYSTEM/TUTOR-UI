import type { Language } from "@/types";

export type ParentsDictionary = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  addHint: string;
  columns: {
    name: string;
    email: string;
    phone: string;
    status: string;
    actions: string;
  };
  statusActive: string;
  statusInactive: string;
  emptyMessage: string;
  errorMessage: string;
  loading: string;
  noEmail: string;
  noPhone: string;
  setPassword: string;
  passwordDialog: {
    title: string;
    subtitle: string;
    passwordLabel: string;
    confirmLabel: string;
    passwordPlaceholder: string;
    mismatch: string;
    submit: string;
    cancel: string;
    toastSuccess: string;
    toastError: string;
  };
  unnamed: string;
};

export const parentsDictionary: Record<Language, ParentsDictionary> = {
  vi: {
    title: "Quản lý phụ huynh",
    subtitle: "Tài khoản phụ huynh và đặt lại mật khẩu cho phụ huynh",
    searchPlaceholder: "Tìm theo tên, email, SĐT...",
    addHint: "Phụ huynh được tạo khi thêm học sinh mới.",
    columns: {
      name: "Phụ huynh",
      email: "Email",
      phone: "Số điện thoại",
      status: "Trạng thái",
      actions: "Thao tác",
    },
    statusActive: "Hoạt động",
    statusInactive: "Đã khoá",
    emptyMessage: "Chưa có phụ huynh nào.",
    errorMessage: "Không tải được danh sách phụ huynh.",
    loading: "Đang tải...",
    noEmail: "—",
    noPhone: "—",
    setPassword: "Đặt mật khẩu",
    passwordDialog: {
      title: "Đặt mật khẩu phụ huynh",
      subtitle: "Phụ huynh sẽ phải đổi mật khẩu khi đăng nhập lần sau",
      passwordLabel: "Mật khẩu mới",
      confirmLabel: "Nhập lại mật khẩu",
      passwordPlaceholder: "Nhập mật khẩu",
      mismatch: "Mật khẩu nhập lại không khớp",
      submit: "Lưu mật khẩu",
      cancel: "Hủy",
      toastSuccess: "Đã đặt mật khẩu cho phụ huynh",
      toastError: "Không thể đặt mật khẩu",
    },
    unnamed: "Chưa có tên",
  },
  en: {
    title: "Parent management",
    subtitle: "Parent accounts and password reset",
    searchPlaceholder: "Search name, email, phone...",
    addHint: "Parents are created when a new student is added.",
    columns: {
      name: "Parent",
      email: "Email",
      phone: "Phone",
      status: "Status",
      actions: "Actions",
    },
    statusActive: "Active",
    statusInactive: "Locked",
    emptyMessage: "No parents yet.",
    errorMessage: "Could not load parents.",
    loading: "Loading...",
    noEmail: "—",
    noPhone: "—",
    setPassword: "Set password",
    passwordDialog: {
      title: "Set parent password",
      subtitle: "The parent must change the password at next sign-in",
      passwordLabel: "New password",
      confirmLabel: "Confirm password",
      passwordPlaceholder: "Enter password",
      mismatch: "Passwords do not match",
      submit: "Save password",
      cancel: "Cancel",
      toastSuccess: "Parent password updated",
      toastError: "Could not set password",
    },
    unnamed: "No name",
  },
};
