import type { Language, NotificationType } from "@/types";
import type { UserRole } from "@/lib/rbac/roles";

type TabCopy = { label: string; desc: string };

export type SettingsDictionary = {
  tabs: {
    profile: TabCopy;
    security: TabCopy;
    notifications: TabCopy;
    appearance: TabCopy;
    classes: TabCopy;
    fees: TabCopy;
  };
  tutorProfileDesc: string;
  appearance: {
    themeTitle: string;
    light: string;
    dark: string;
    accentTitle: string;
    accentDesc: string;
    languageTitle: string;
    vietnamese: { label: string; sub: string };
    english: { label: string; sub: string };
  };
  common: { save: string; saving: string; saved: string };
  profile: {
    avatarTitle: string;
    avatarHint: string;
    tutorAvatarHint: string;
    uploadPhoto: string;
    uploading: string;
    removePhoto: string;
    removing: string;
    basicInfoTitle: string;
    personalInfoTitle: string;
    lastName: string;
    firstName: string;
    email: string;
    phone: string;
    bio: string;
    tutorBio: string;
    teachingSubjects: string;
    studentNameLocked: string;
    linkedStudentsTitle: string;
    linkedStudentsUnavailable: string;
    addressTitle: string;
    address: string;
    district: string;
    province: string;
    avatarTooLarge: string;
    uploadFailed: string;
    removeFailed: string;
    updateFailed: string;
    subjectPlaceholder: string;
    subjectAdd: string;
    subjectRemove: string;
  };
  security: {
    changePasswordTitle: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    passwordHint: string;
    updatePassword: string;
    updatingPassword: string;
    updateSuccess: string;
    validation: {
      currentRequired: string;
      min: string;
      max: string;
      upper: string;
      lower: string;
      digit: string;
      special: string;
      confirmRequired: string;
      mismatch: string;
    };
    socialTitle: string;
    socialNotLinked: string;
    socialLinked: string;
    socialLink: string;
    socialUnlink: string;
    socialHint: string;
    sessionsTitle: string;
    sessions: { device: string; location: string; time: string; current: boolean }[];
    currentBadge: string;
    signOut: string;
    signOutAll: string;
  };
  notifications: {
    channelsTitle: string;
    channels: { label: string; desc: string }[];
    typesTitle: string;
    /** Tên loại (khớp enum `NotificationType` của BE). */
    typeLabels: Record<NotificationType, string>;
    /** Loại nào role nào nhận + mô tả theo vai trò — thiếu key = role đó không nhận loại này. */
    types: Record<UserRole, Partial<Record<NotificationType, string>>>;
    scheduleTitle: string;
    /** Thiếu role = không có mục lịch cho role đó (vd ADMIN không dạy/học). */
    schedule: Partial<Record<UserRole, { label: string; desc: string }[]>>;
  };
  classes: {
    defaultsTitle: string;
    sessionDuration: string;
    durations: { label: string; value: string }[];
    defaultFee: string;
    timezone: string;
    timezones: { label: string; value: string }[];
    workHours: string;
    switches: { label: string; desc: string }[];
  };
  fees: {
    receivingAccount: string;
    default: string;
    bankInfoTitle: string;
    bank: string;
    holder: string;
    accountNumber: string;
    branch: string;
    qrTitle: string;
    qrAuto: string;
    qrDesc: string;
    downloadQr: string;
    copyAccount: string;
    copied: string;
    copyFailed: string;
    notConfigured: string;
    loading: string;
    required: string;
    switches: { label: string; desc: string }[];
  };
};

const vi: SettingsDictionary = {
  tabs: {
    profile: { label: "Hồ sơ cá nhân", desc: "Thông tin và ảnh đại diện" },
    security: { label: "Bảo mật", desc: "Mật khẩu và xác thực" },
    notifications: { label: "Thông báo", desc: "Tuỳ chọn nhận thông báo" },
    appearance: {
      label: "Giao diện & Ngôn ngữ",
      desc: "Tuỳ chỉnh cách bảng điều khiển hiển thị.",
    },
    classes: {
      label: "Giảng dạy",
      desc: "Thiết lập mặc định áp dụng khi tạo buổi học và lớp mới.",
    },
    fees: { label: "Thanh toán", desc: "Tài khoản nhận học phí từ phụ huynh." },
  },
  tutorProfileDesc:
    "Thông tin này hiển thị với phụ huynh và học sinh của bạn.",
  appearance: {
    themeTitle: "Chủ đề hiển thị",
    light: "Sáng",
    dark: "Tối",
    accentTitle: "Màu nhấn",
    accentDesc: "Màu chủ đạo cho nút và trạng thái hoạt động.",
    languageTitle: "Ngôn ngữ",
    vietnamese: { label: "Tiếng Việt", sub: "Mặc định" },
    english: { label: "English", sub: "English (US)" },
  },
  common: { save: "Lưu thay đổi", saving: "Đang lưu...", saved: "Đã lưu!" },
  profile: {
    avatarTitle: "Ảnh đại diện",
    avatarHint: "JPG, PNG tối đa 2MB",
    tutorAvatarHint: "PNG hoặc JPG, tối thiểu 400×400px. Tối đa 2MB.",
    uploadPhoto: "Tải ảnh lên",
    uploading: "Đang tải...",
    removePhoto: "Xoá ảnh",
    removing: "Đang xoá...",
    basicInfoTitle: "Thông tin cơ bản",
    personalInfoTitle: "Thông tin cá nhân",
    lastName: "Họ",
    firstName: "Tên",
    email: "Email",
    phone: "Số điện thoại",
    bio: "Giới thiệu",
    tutorBio: "Giới thiệu bản thân",
    teachingSubjects: "Môn giảng dạy",
    studentNameLocked:
      "Học sinh không thể tự đổi họ tên — liên hệ gia sư hoặc quản trị viên nếu cần chỉnh sửa.",
    linkedStudentsTitle: "Học sinh liên kết",
    linkedStudentsUnavailable:
      "Chức năng xem học sinh liên kết hiện chưa khả dụng.",
    addressTitle: "Địa chỉ",
    address: "Địa chỉ",
    district: "Quận / Huyện",
    province: "Tỉnh / Thành phố",
    avatarTooLarge: "Ảnh tối đa 2MB",
    uploadFailed: "Tải ảnh thất bại",
    removeFailed: "Xoá ảnh thất bại",
    updateFailed: "Cập nhật thất bại",
    subjectPlaceholder: "Tên môn học",
    subjectAdd: "+ Thêm môn",
    subjectRemove: "Xoá",
  },
  security: {
    changePasswordTitle: "Đổi mật khẩu",
    currentPassword: "Mật khẩu hiện tại",
    newPassword: "Mật khẩu mới",
    confirmPassword: "Xác nhận mật khẩu mới",
    passwordHint:
      "Mật khẩu tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số.",
    updatePassword: "Cập nhật mật khẩu",
    updatingPassword: "Đang cập nhật...",
    updateSuccess: "Cập nhật mật khẩu thành công",
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
    },
    socialTitle: "Liên kết tài khoản mạng xã hội",
    socialNotLinked: "Chưa liên kết",
    socialLinked: "Đã liên kết",
    socialLink: "Liên kết",
    socialUnlink: "Huỷ liên kết",
    socialHint:
      "Liên kết tài khoản mạng xã hội để đăng nhập nhanh mà không cần mật khẩu.",
    sessionsTitle: "Phiên đăng nhập",
    sessions: [
      { device: "Chrome · Windows 11", location: "TP. Hồ Chí Minh", time: "Đang hoạt động", current: true },
      { device: "Safari · iPhone 14", location: "TP. Hồ Chí Minh", time: "2 giờ trước", current: false },
      { device: "Firefox · MacOS", location: "Hà Nội", time: "Hôm qua", current: false },
    ],
    currentBadge: "Hiện tại",
    signOut: "Đăng xuất",
    signOutAll: "Đăng xuất khỏi tất cả thiết bị",
  },
  notifications: {
    channelsTitle: "Kênh thông báo",
    channels: [
      { label: "Thông báo trong ứng dụng", desc: "Hiển thị thông báo trực tiếp trên màn hình" },
      { label: "Email", desc: "Gửi tóm tắt thông báo về email" },
      { label: "SMS", desc: "Nhắn tin đến số điện thoại đã đăng ký" },
    ],
    typesTitle: "Loại thông báo",
    typeLabels: { SYSTEM: "Hệ thống", TUITION: "Học phí", STUDENT: "Học sinh", TUTOR: "Gia sư" },
    types: {
      ADMIN: {
        SYSTEM: "Bảo trì, cập nhật tính năng, cảnh báo hệ thống",
        TUITION: "Giao dịch học phí và công nợ toàn hệ thống",
        STUDENT: "Học sinh mới đăng ký, thay đổi hồ sơ",
        TUTOR: "Gia sư mới, thay đổi hồ sơ gia sư",
      },
      TUTOR: {
        SYSTEM: "Bảo trì, cập nhật tính năng",
        TUITION: "Phụ huynh thanh toán, học phí đến hạn",
        STUDENT: "Học sinh nghỉ học, nộp bài, kết quả kiểm tra",
        TUTOR: "Cập nhật chương trình, nhắc nhở nội bộ",
      },
      STUDENT: {
        SYSTEM: "Bảo trì, cập nhật tính năng",
        TUITION: "Nhắc học phí, xác nhận thanh toán",
        TUTOR: "Bài tập mới, bài giải, thay đổi lịch từ gia sư",
      },
      PARENT: {
        SYSTEM: "Bảo trì, cập nhật tính năng",
        TUITION: "Nhắc học phí, biên lai thanh toán của con",
        STUDENT: "Con nghỉ học, điểm và kết quả học tập",
        TUTOR: "Nhận xét, thay đổi lịch học từ gia sư",
      },
    },
    scheduleTitle: "Lịch nhận thông báo",
    schedule: {
      TUTOR: [
        { label: "Nhắc lịch trước 30 phút", desc: "Thông báo trước mỗi buổi dạy" },
        { label: "Tóm tắt cuối ngày", desc: "Gửi lúc 21:00 mỗi ngày" },
        { label: "Tóm tắt cuối tuần", desc: "Gửi sáng Chủ nhật hàng tuần" },
      ],
      STUDENT: [
        { label: "Nhắc lịch trước 30 phút", desc: "Thông báo trước mỗi buổi học" },
        { label: "Nhắc hạn nộp bài", desc: "Nhắc trước hạn nộp bài tập 1 ngày" },
      ],
      PARENT: [
        { label: "Nhắc lịch học của con", desc: "Thông báo trước mỗi buổi học 30 phút" },
        { label: "Tóm tắt cuối tuần", desc: "Tổng hợp việc học của con vào sáng Chủ nhật" },
      ],
    },
  },
  classes: {
    defaultsTitle: "Mặc định buổi học",
    sessionDuration: "Thời lượng buổi học",
    durations: [
      { label: "60 phút", value: "60" },
      { label: "90 phút", value: "90" },
      { label: "120 phút", value: "120" },
    ],
    defaultFee: "Học phí mặc định / buổi",
    timezone: "Múi giờ",
    timezones: [
      { label: "(GMT+7) Hà Nội", value: "hanoi" },
      { label: "(GMT+7) TP. Hồ Chí Minh", value: "hcm" },
      { label: "(GMT+7) Đà Nẵng", value: "danang" },
    ],
    workHours: "Giờ làm việc",
    switches: [
      { label: "Tự động nhắc học sinh", desc: "Gửi SMS nhắc học sinh trước buổi học 1 giờ." },
      { label: "Cho phép đặt lịch online", desc: "Học sinh có thể tự đăng ký vào khung giờ trống." },
      { label: "Tự động tạo hoá đơn cuối tháng", desc: "Tổng hợp học phí theo số buổi đã dạy." },
      { label: "Thời gian nghỉ giữa buổi", desc: "Tự chừa 15 phút giữa hai buổi liên tiếp." },
    ],
  },
  fees: {
    receivingAccount: "Tài khoản nhận tiền",
    default: "Mặc định",
    bankInfoTitle: "Thông tin ngân hàng",
    bank: "Ngân hàng",
    holder: "Chủ tài khoản",
    accountNumber: "Số tài khoản",
    branch: "Chi nhánh",
    qrTitle: "Mã QR nhận học phí",
    qrAuto: "Tự động tạo",
    qrDesc:
      "Mã được tạo từ thông tin ngân hàng ở trên. Phụ huynh quét để chuyển học phí trực tiếp vào tài khoản của bạn.",
    downloadQr: "Tải mã QR",
    copyAccount: "Sao chép số TK",
    copied: "Đã sao chép số tài khoản",
    copyFailed: "Sao chép thất bại",
    notConfigured: "Chưa có tài khoản nhận tiền",
    loading: "Đang tải...",
    required: "Vui lòng nhập đầy đủ tên ngân hàng, chủ tài khoản và số tài khoản",
    switches: [
      { label: "Gửi nhắc thanh toán tự động", desc: "Nhắn phụ huynh khi học phí đến hạn." },
      { label: "Gửi biên lai điện tử", desc: "Tự động gửi biên lai sau mỗi lần nhận tiền." },
    ],
  },
};

const en: SettingsDictionary = {
  tabs: {
    profile: { label: "Profile", desc: "Personal info and avatar" },
    security: { label: "Security", desc: "Password and authentication" },
    notifications: {
      label: "Notifications",
      desc: "Notification preferences",
    },
    appearance: {
      label: "Appearance & Language",
      desc: "Customize how the dashboard looks.",
    },
    classes: {
      label: "Teaching",
      desc: "Defaults applied when creating new sessions and classes.",
    },
    fees: { label: "Payments", desc: "Account that receives tuition from parents." },
  },
  tutorProfileDesc: "This information is visible to your students and parents.",
  appearance: {
    themeTitle: "Theme",
    light: "Light",
    dark: "Dark",
    accentTitle: "Accent color",
    accentDesc: "Primary color for buttons and active states.",
    languageTitle: "Language",
    vietnamese: { label: "Tiếng Việt", sub: "Default" },
    english: { label: "English", sub: "English (US)" },
  },
  common: { save: "Save changes", saving: "Saving...", saved: "Saved!" },
  profile: {
    avatarTitle: "Profile photo",
    avatarHint: "JPG, PNG up to 2MB",
    tutorAvatarHint: "PNG or JPG, at least 400×400px. Max 2MB.",
    uploadPhoto: "Upload photo",
    uploading: "Uploading...",
    removePhoto: "Remove photo",
    removing: "Removing...",
    basicInfoTitle: "Basic information",
    personalInfoTitle: "Personal information",
    lastName: "Last name",
    firstName: "First name",
    email: "Email",
    phone: "Phone number",
    bio: "About",
    tutorBio: "About me",
    teachingSubjects: "Teaching subjects",
    studentNameLocked:
      "Students can't change their own name — contact your tutor or an administrator to make changes.",
    linkedStudentsTitle: "Linked students",
    linkedStudentsUnavailable: "Viewing linked students isn't available yet.",
    addressTitle: "Address",
    address: "Address",
    district: "District",
    province: "Province / City",
    avatarTooLarge: "Image must be 2MB or smaller",
    uploadFailed: "Failed to upload photo",
    removeFailed: "Failed to remove photo",
    updateFailed: "Update failed",
    subjectPlaceholder: "Subject name",
    subjectAdd: "+ Add subject",
    subjectRemove: "Remove",
  },
  security: {
    changePasswordTitle: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    passwordHint:
      "Password must be at least 8 characters, including uppercase, lowercase and a number.",
    updatePassword: "Update password",
    updatingPassword: "Updating...",
    updateSuccess: "Password updated successfully",
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
    },
    socialTitle: "Linked social accounts",
    socialNotLinked: "Not linked",
    socialLinked: "Linked",
    socialLink: "Link",
    socialUnlink: "Unlink",
    socialHint: "Link a social account to sign in quickly without a password.",
    sessionsTitle: "Login sessions",
    sessions: [
      { device: "Chrome · Windows 11", location: "Ho Chi Minh City", time: "Active now", current: true },
      { device: "Safari · iPhone 14", location: "Ho Chi Minh City", time: "2 hours ago", current: false },
      { device: "Firefox · MacOS", location: "Hanoi", time: "Yesterday", current: false },
    ],
    currentBadge: "Current",
    signOut: "Sign out",
    signOutAll: "Sign out of all devices",
  },
  notifications: {
    channelsTitle: "Notification channels",
    channels: [
      { label: "In-app notifications", desc: "Show notifications directly on screen" },
      { label: "Email", desc: "Send a notification summary by email" },
      { label: "SMS", desc: "Text the registered phone number" },
    ],
    typesTitle: "Notification types",
    typeLabels: { SYSTEM: "System", TUITION: "Tuition", STUDENT: "Students", TUTOR: "Tutors" },
    types: {
      ADMIN: {
        SYSTEM: "Maintenance, feature updates, system alerts",
        TUITION: "Tuition transactions and balances across the system",
        STUDENT: "New student sign-ups, profile changes",
        TUTOR: "New tutors, tutor profile changes",
      },
      TUTOR: {
        SYSTEM: "Maintenance, feature updates",
        TUITION: "Parent payments, tuition due dates",
        STUDENT: "Student absences, submissions, test results",
        TUTOR: "Curriculum updates, internal reminders",
      },
      STUDENT: {
        SYSTEM: "Maintenance, feature updates",
        TUITION: "Tuition reminders, payment confirmations",
        TUTOR: "New assignments, solutions, schedule changes from your tutor",
      },
      PARENT: {
        SYSTEM: "Maintenance, feature updates",
        TUITION: "Tuition reminders, receipts for your child's payments",
        STUDENT: "Your child's absences, grades and results",
        TUTOR: "Feedback and schedule changes from the tutor",
      },
    },
    scheduleTitle: "Notification schedule",
    schedule: {
      TUTOR: [
        { label: "Remind 30 minutes before", desc: "Notify before every teaching session" },
        { label: "Daily summary", desc: "Sent at 21:00 every day" },
        { label: "Weekly summary", desc: "Sent every Sunday morning" },
      ],
      STUDENT: [
        { label: "Remind 30 minutes before", desc: "Notify before every class" },
        { label: "Assignment deadline reminder", desc: "Remind 1 day before an assignment is due" },
      ],
      PARENT: [
        { label: "Remind about your child's class", desc: "Notify 30 minutes before each class" },
        { label: "Weekly summary", desc: "Your child's progress, sent Sunday morning" },
      ],
    },
  },
  classes: {
    defaultsTitle: "Session defaults",
    sessionDuration: "Session duration",
    durations: [
      { label: "60 minutes", value: "60" },
      { label: "90 minutes", value: "90" },
      { label: "120 minutes", value: "120" },
    ],
    defaultFee: "Default fee / session",
    timezone: "Time zone",
    timezones: [
      { label: "(GMT+7) Hanoi", value: "hanoi" },
      { label: "(GMT+7) Ho Chi Minh City", value: "hcm" },
      { label: "(GMT+7) Da Nang", value: "danang" },
    ],
    workHours: "Working hours",
    switches: [
      { label: "Auto-remind students", desc: "Send an SMS 1 hour before each session." },
      { label: "Allow online booking", desc: "Students can sign up for open time slots themselves." },
      { label: "Auto-generate month-end invoices", desc: "Sum up tuition by the number of sessions taught." },
      { label: "Break between sessions", desc: "Leave 15 minutes between back-to-back sessions." },
    ],
  },
  fees: {
    receivingAccount: "Receiving account",
    default: "Default",
    bankInfoTitle: "Bank information",
    bank: "Bank",
    holder: "Account holder",
    accountNumber: "Account number",
    branch: "Branch",
    qrTitle: "Tuition QR code",
    qrAuto: "Auto-generated",
    qrDesc:
      "The code is generated from the bank details above. Parents scan it to pay tuition straight into your account.",
    downloadQr: "Download QR",
    copyAccount: "Copy account no.",
    copied: "Account number copied",
    copyFailed: "Copy failed",
    notConfigured: "No receiving account yet",
    loading: "Loading...",
    required: "Please fill in the bank name, account holder and account number",
    switches: [
      { label: "Send automatic payment reminders", desc: "Message parents when tuition is due." },
      { label: "Send e-receipts", desc: "Automatically send a receipt after each payment." },
    ],
  },
};

export const settingsDictionary: Record<Language, SettingsDictionary> = {
  vi,
  en,
};
