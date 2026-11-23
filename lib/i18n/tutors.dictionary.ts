import type { Language } from "@/types";

export type TutorValidationMessages = {
  required: string;
  emailInvalid: string;
  nameMin: string;
  nameMax: string;
  phoneMax: string;
  schoolMax: string;
  passwordMin: string;
  passwordMax: string;
  passwordLower: string;
  passwordUpper: string;
  passwordDigit: string;
  passwordSpecial: string;
};

export type TutorsDictionary = {
  page: {
    title: string;
    countSuffix: (count: number) => string;
    searchPlaceholder: string;
    add: string;
    noAccessTitle: string;
    noAccessDescription: string;
    empty: string;
    loadError: string;
    subjectsDetail: (count: number) => string;
    studentsDetail: (count: number) => string;
  };
  columns: {
    index: string;
    tutor: string;
    subjects: string;
    phone: string;
    classCount: string;
    studentCount: string;
    status: string;
    actions: string;
  };
  unnamed: string;
  status: {
    active: string;
    locked: string;
    toggleTitle: string;
  };
  statusDialog: {
    lockTitle: string;
    lockDescription: (name: string) => string;
    lockConfirm: string;
    unlockTitle: string;
    unlockDescription: (name: string) => string;
    unlockConfirm: string;
    cancel: string;
  };
  rowActions: {
    edit: string;
    delete: string;
    lock: string;
    unlock: string;
    password: string;
  };
  passwordDialog: {
    title: string;
    subtitle: string;
    submit: string;
    cancel: string;
    passwordLabel: string;
    confirmLabel: string;
    mismatch: string;
    toastSuccess: string;
    toastError: string;
  };
  toast: {
    created: string;
    createFailed: string;
    updated: string;
    updateFailed: string;
    deleted: string;
    deleteFailed: string;
    statusUpdated: string;
    statusFailed: string;
  };
  addDialog: {
    title: string;
    subtitle: string;
    cancel: string;
    submit: string;
  };
  editDialog: {
    title: string;
    subtitle: string;
    cancel: string;
    submit: string;
  };
  deleteDialog: {
    title: string;
    description: (name: string) => string;
    cancel: string;
    confirm: string;
  };
  fields: {
    lastName: string;
    firstName: string;
    email: string;
    password: string;
    passwordHint: string;
    phone: string;
    gender: string;
    subjects: string;
    subjectsHint: string;
    school: string;
    lastNamePlaceholder: string;
    firstNamePlaceholder: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    phonePlaceholder: string;
    schoolPlaceholder: string;
    genderOptions: { label: string; value: "MALE" | "FEMALE" | "OTHER" }[];
  };
  guide: {
    title: string;
    steps: { n: number; title: string; body: string }[];
  };
  validation: TutorValidationMessages;
};

export const tutorsDictionary: Record<Language, TutorsDictionary> = {
  vi: {
    page: {
      title: "Gia sư",
      countSuffix: (count) => `${count} gia sư`,
      searchPlaceholder: "Tìm theo tên, email...",
      add: "Thêm gia sư",
      noAccessTitle: "Không có quyền truy cập",
      noAccessDescription:
        "Chỉ quản trị viên mới có thể xem và quản lý danh sách gia sư.",
      empty: "Chưa có gia sư phù hợp.",
      loadError: "Không thể tải danh sách gia sư.",
      subjectsDetail: (count) => `${count} môn dạy`,
      studentsDetail: (count) => `${count} học sinh`,
    },
    columns: {
      index: "Thứ tự",
      tutor: "Gia sư",
      subjects: "Môn dạy",
      phone: "Số điện thoại",
      classCount: "Số lớp đang quản lý",
      studentCount: "Học sinh",
      status: "Trạng thái",
      actions: "Thao tác",
    },
    unnamed: "Chưa đặt tên",
    status: {
      active: "Hoạt động",
      locked: "Đã khoá",
      toggleTitle: "Bấm để đổi trạng thái",
    },
    statusDialog: {
      lockTitle: "Xác nhận khoá tài khoản",
      lockDescription: (name) =>
        `Bạn có chắc muốn khoá tài khoản gia sư ${name}? Gia sư này sẽ không thể đăng nhập cho tới khi được mở khoá.`,
      lockConfirm: "Khoá",
      unlockTitle: "Xác nhận mở khoá tài khoản",
      unlockDescription: (name) =>
        `Bạn có chắc muốn mở khoá tài khoản gia sư ${name}? Gia sư này sẽ có thể đăng nhập trở lại.`,
      unlockConfirm: "Mở khoá",
      cancel: "Hủy",
    },
    rowActions: {
      edit: "Chỉnh sửa",
      delete: "Xóa",
      lock: "Khoá tài khoản",
      unlock: "Mở khoá tài khoản",
      password: "Đặt mật khẩu",
    },
    passwordDialog: {
      title: "Đặt mật khẩu cho gia sư",
      subtitle: "Gia sư đăng nhập bằng email và mật khẩu mới này.",
      submit: "Lưu mật khẩu",
      cancel: "Hủy",
      passwordLabel: "Mật khẩu mới",
      confirmLabel: "Nhập lại mật khẩu",
      mismatch: "Mật khẩu nhập lại không khớp",
      toastSuccess: "Đặt mật khẩu thành công!",
      toastError: "Đặt mật khẩu thất bại",
    },
    toast: {
      created: "Thêm gia sư thành công!",
      createFailed: "Thêm gia sư thất bại",
      updated: "Cập nhật gia sư thành công!",
      updateFailed: "Cập nhật gia sư thất bại",
      deleted: "Xóa gia sư thành công!",
      deleteFailed: "Xóa gia sư thất bại",
      statusUpdated: "Cập nhật trạng thái thành công!",
      statusFailed: "Cập nhật trạng thái thất bại",
    },
    addDialog: {
      title: "Thêm gia sư mới",
      subtitle: "Tạo tài khoản vai trò gia sư (TUTOR).",
      cancel: "Hủy",
      submit: "Lưu gia sư",
    },
    editDialog: {
      title: "Chỉnh sửa gia sư",
      subtitle: "Cập nhật thông tin tài khoản gia sư.",
      cancel: "Hủy",
      submit: "Lưu thay đổi",
    },
    deleteDialog: {
      title: "Xác nhận xóa",
      description: (name) =>
        `Bạn có chắc muốn xóa gia sư ${name}? Tài khoản sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.`,
      cancel: "Hủy",
      confirm: "Xóa",
    },
    fields: {
      lastName: "Họ",
      firstName: "Tên",
      email: "Email",
      password: "Mật khẩu",
      passwordHint: "8–20 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
      phone: "Số điện thoại",
      gender: "Giới tính",
      subjects: "Môn dạy",
      subjectsHint: "Chọn một hoặc nhiều môn.",
      school: "Trường / Nơi công tác",
      lastNamePlaceholder: "VD: Trần",
      firstNamePlaceholder: "VD: Văn Khoa",
      emailPlaceholder: "VD: giasu@example.com",
      passwordPlaceholder: "••••••••",
      phonePlaceholder: "VD: 0901 234 567",
      schoolPlaceholder: "VD: THPT Quang Trung",
      genderOptions: [
        { label: "Nam", value: "MALE" },
        { label: "Nữ", value: "FEMALE" },
        { label: "Khác", value: "OTHER" },
      ],
    },
    guide: {
      title: "Hướng dẫn sử dụng",
      steps: [
        {
          n: 1,
          title: "Tìm gia sư",
          body: "Gõ tên hoặc email vào ô tìm kiếm ở góc trên bên phải để lọc danh sách.",
        },
        {
          n: 2,
          title: "Thêm gia sư",
          body: "Nhấn Thêm gia sư để tạo tài khoản gia sư mới.",
        },
        {
          n: 3,
          title: "Thông tin nhanh",
          body: "Cột Môn dạy, SĐT, Sĩ số lớp và Học sinh cho biết khối lượng công việc của từng gia sư.",
        },
        {
          n: 4,
          title: "Trạng thái và thao tác",
          body: "Nhấn nhãn Hoạt động / Đã khoá để đổi trạng thái. Biểu tượng bút chì để sửa, thùng rác để xoá gia sư.",
        },
      ],
    },
    validation: {
      required: "Vui lòng nhập thông tin này",
      emailInvalid: "Email không hợp lệ",
      nameMin: "Phải có ít nhất 2 ký tự",
      nameMax: "Tối đa 100 ký tự",
      phoneMax: "SĐT tối đa 20 ký tự",
      schoolMax: "Trường tối đa 255 ký tự",
      passwordMin: "Mật khẩu phải có ít nhất 8 ký tự",
      passwordMax: "Mật khẩu tối đa 20 ký tự",
      passwordLower: "Mật khẩu phải có ít nhất một chữ thường (a-z)",
      passwordUpper: "Mật khẩu phải có ít nhất một chữ hoa (A-Z)",
      passwordDigit: "Mật khẩu phải có ít nhất một chữ số (0-9)",
      passwordSpecial: "Mật khẩu phải có ít nhất một ký tự đặc biệt",
    },
  },
  en: {
    page: {
      title: "Tutors",
      countSuffix: (count) => `${count} tutor${count === 1 ? "" : "s"}`,
      searchPlaceholder: "Search by name, email...",
      add: "Add tutor",
      noAccessTitle: "Access denied",
      noAccessDescription: "Only administrators can view and manage tutors.",
      empty: "No matching tutors.",
      loadError: "Could not load tutors.",
      subjectsDetail: (count) => `${count} subjects`,
      studentsDetail: (count) => `${count} students`,
    },
    columns: {
      index: "No.",
      tutor: "Tutor",
      subjects: "Subjects",
      phone: "Phone",
      classCount: "Classes managed",
      studentCount: "Students",
      status: "Status",
      actions: "Actions",
    },
    unnamed: "Unnamed",
    status: {
      active: "Active",
      locked: "Locked",
      toggleTitle: "Click to change status",
    },
    statusDialog: {
      lockTitle: "Confirm account lock",
      lockDescription: (name) =>
        `Are you sure you want to lock the account of tutor ${name}? This tutor will not be able to sign in until the account is unlocked.`,
      lockConfirm: "Lock",
      unlockTitle: "Confirm account unlock",
      unlockDescription: (name) =>
        `Are you sure you want to unlock the account of tutor ${name}? This tutor will be able to sign in again.`,
      unlockConfirm: "Unlock",
      cancel: "Cancel",
    },
    rowActions: {
      edit: "Edit",
      delete: "Delete",
      lock: "Lock account",
      unlock: "Unlock account",
      password: "Set password",
    },
    passwordDialog: {
      title: "Set tutor password",
      subtitle: "The tutor signs in with their email and this new password.",
      submit: "Save password",
      cancel: "Cancel",
      passwordLabel: "New password",
      confirmLabel: "Confirm password",
      mismatch: "Passwords do not match",
      toastSuccess: "Password set successfully!",
      toastError: "Failed to set password",
    },
    toast: {
      created: "Tutor added successfully!",
      createFailed: "Failed to add tutor",
      updated: "Tutor updated successfully!",
      updateFailed: "Failed to update tutor",
      deleted: "Tutor deleted successfully!",
      deleteFailed: "Failed to delete tutor",
      statusUpdated: "Status updated successfully!",
      statusFailed: "Failed to update status",
    },
    addDialog: {
      title: "Add new tutor",
      subtitle: "Create a tutor account (TUTOR).",
      cancel: "Cancel",
      submit: "Save tutor",
    },
    editDialog: {
      title: "Edit tutor",
      subtitle: "Update the tutor's account information.",
      cancel: "Cancel",
      submit: "Save changes",
    },
    deleteDialog: {
      title: "Confirm deletion",
      description: (name) =>
        `Are you sure you want to delete tutor ${name}? The account will be removed from the system. This action cannot be undone.`,
      cancel: "Cancel",
      confirm: "Delete",
    },
    fields: {
      lastName: "Last name",
      firstName: "First name",
      email: "Email",
      password: "Password",
      passwordHint: "8–20 characters, including uppercase, lowercase, a digit and a special character.",
      phone: "Phone number",
      gender: "Gender",
      subjects: "Subjects",
      subjectsHint: "Choose one or more subjects.",
      school: "School / Workplace",
      lastNamePlaceholder: "e.g. Tran",
      firstNamePlaceholder: "e.g. Van Khoa",
      emailPlaceholder: "e.g. tutor@example.com",
      passwordPlaceholder: "••••••••",
      phonePlaceholder: "e.g. 0901 234 567",
      schoolPlaceholder: "e.g. Quang Trung High School",
      genderOptions: [
        { label: "Male", value: "MALE" },
        { label: "Female", value: "FEMALE" },
        { label: "Other", value: "OTHER" },
      ],
    },
    guide: {
      title: "User guide",
      steps: [
        {
          n: 1,
          title: "Find a tutor",
          body: "Type a name or email in the search box at the top right to filter the list.",
        },
        {
          n: 2,
          title: "Add a tutor",
          body: "Click Add tutor to create a new tutor account.",
        },
        {
          n: 3,
          title: "Quick info",
          body: "The Subjects, Phone, Class size and Students columns show each tutor's workload.",
        },
        {
          n: 4,
          title: "Status and actions",
          body: "Click the Active / Locked badge to change status. Use the pencil icon to edit and the bin icon to delete a tutor.",
        },
      ],
    },
    validation: {
      required: "This field is required",
      emailInvalid: "Invalid email address",
      nameMin: "Must be at least 2 characters",
      nameMax: "At most 100 characters",
      phoneMax: "Phone must be at most 20 characters",
      schoolMax: "School must be at most 255 characters",
      passwordMin: "Password must be at least 8 characters",
      passwordMax: "Password must be at most 20 characters",
      passwordLower: "Password must include at least one lowercase letter (a-z)",
      passwordUpper: "Password must include at least one uppercase letter (A-Z)",
      passwordDigit: "Password must include at least one digit (0-9)",
      passwordSpecial: "Password must include at least one special character",
    },
  },
};
