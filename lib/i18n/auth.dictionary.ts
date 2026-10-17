import type { Language } from "@/types";

export type AuthDictionary = {
  shared: {
    continueWith: string;
    google: string;
    facebook: string;
    showPassword: string;
    hidePassword: string;
    processing: string;
    encryptedNote: string;
    requiredField: string;
    passwordTooShort: string;
    passwordTooLong: string;
    backToLogin: string;
    back: string;
    footer: string;
  };
  hero: {
    brand: string;
    tagline: string;
    title: string;
    description: string;
    statsTutors: string;
    statsSessions: string;
    statsRating: string;
    quote: string;
    quoteName: string;
    quoteRole: string;
  };
  login: {
    heading: string;
    subtitle: string;
    roleAdmin: string;
    roleStudent: string;
    roleParent: string;
    emailLabel: string;
    emailPlaceholder: string;
    identifierLabel: string;
    identifierPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    submit: string;
    errorFallback: string;
    noAccount: string;
    registerNow: string;
  };
  register: {
    heading: string;
    subtitle: string;
    firstNameLabel: string;
    firstNamePlaceholder: string;
    lastNameLabel: string;
    lastNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    passwordMismatch: string;
    submit: string;
    pendingLabel: string;
    errorFallback: string;
    haveAccount: string;
    signIn: string;
  };
  forgotPassword: {
    heading: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    submit: string;
    pendingLabel: string;
    errorFallback: string;
    sentTitle: string;
    sentSubtitle: string;
    sentMessagePrefix: string;
    sentMessageSuffix: string;
    resend: string;
  };
  resetPassword: {
    heading: string;
    subtitle: string;
    missingToken: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmLabel: string;
    confirmPlaceholder: string;
    passwordMismatch: string;
    submit: string;
    pendingLabel: string;
    errorFallback: string;
    successTitle: string;
    successSubtitle: string;
    loginNow: string;
  };
  verifyEmail: {
    heading: string;
    verifyingTitle: string;
    verifyingSubtitle: string;
    missingToken: string;
    successTitle: string;
    successSubtitle: string;
    loginNow: string;
    errorTitle: string;
    errorSubtitle: string;
    errorFallback: string;
  };
  oauthCallback: {
    title: string;
    subtitle: string;
    waitMessage: string;
  };
};

const vi: AuthDictionary = {
  shared: {
    continueWith: "hoặc tiếp tục với",
    google: "Google",
    facebook: "Facebook",
    showPassword: "Hiện mật khẩu",
    hidePassword: "Ẩn mật khẩu",
    processing: "Đang xử lý…",
    encryptedNote: "Thông tin của bạn được bảo vệ & mã hóa",

    requiredField: "Vui lòng nhập thông tin này",
    passwordTooShort: "Mật khẩu phải có ít nhất 8 ký tự",
    passwordTooLong: "Mật khẩu tối đa 100 ký tự",
    backToLogin: "Quay lại đăng nhập",
    back: "Quay lại",
    footer: "© 2026 Gia Sư Pro · Hỗ trợ · Điều khoản",
  },
  hero: {
    brand: "Gia Sư Pro",
    tagline: "Nền tảng quản lý dạy & học",
    title: "Dạy thông minh hơn, quản lý nhẹ nhàng hơn.",
    description:
      "Lịch học, điểm danh, học phí và liên lạc với phụ huynh — tất cả trong một nơi. Dành cho gia sư, học sinh và phụ huynh.",
    statsTutors: "Gia sư tin dùng",
    statsSessions: "Buổi học mỗi tháng",
    statsRating: "Đánh giá phụ huynh",
    quote:
      "Từ ngày dùng Gia Sư Pro mình không còn ghi sổ học phí tay nữa. Phụ huynh quét QR là xong, đối soát cực nhanh.",
    quoteName: "Cô Thu Lan",
    quoteRole: "Gia sư Tiếng Anh · Hà Nội",
  },
  login: {
    heading: "Đăng nhập",
    subtitle: "Chào mừng trở lại! Chọn vai trò và đăng nhập.",
    roleAdmin: "Gia sư",
    roleStudent: "Học sinh",
    roleParent: "Phụ huynh",
    emailLabel: "Email hoặc số điện thoại",
    emailPlaceholder: "quan.nguyen@giasupro.vn",
    identifierLabel: "Mã người dùng hoặc email",
    identifierPlaceholder: "Nhập mã người dùng hoặc email",
    passwordLabel: "Mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu",
    forgotPassword: "Quên mật khẩu?",
    submit: "Đăng nhập",
    errorFallback: "Đăng nhập thất bại",
    noAccount: "Chưa có tài khoản gia sư?",
    registerNow: "Đăng ký ngay",
  },
  register: {
    heading: "Tạo tài khoản",
    subtitle: "Bắt đầu quản lý lớp học của bạn ngay hôm nay.",
    firstNameLabel: "Họ",
    firstNamePlaceholder: "Nguyễn",
    lastNameLabel: "Tên",
    lastNamePlaceholder: "An",
    emailLabel: "Email",
    emailPlaceholder: "name@example.com",
    passwordLabel: "Mật khẩu",
    passwordPlaceholder: "Tối thiểu 8 ký tự",
    confirmPasswordLabel: "Xác nhận mật khẩu",
    confirmPasswordPlaceholder: "Nhập lại mật khẩu",
    passwordMismatch: "Mật khẩu xác nhận không khớp",
    submit: "Đăng ký",
    pendingLabel: "Đang tạo tài khoản…",
    errorFallback: "Đăng ký thất bại",
    haveAccount: "Đã có tài khoản?",
    signIn: "Đăng nhập",
  },
  forgotPassword: {
    heading: "Quên mật khẩu?",
    subtitle: "Nhập email để nhận liên kết đặt lại mật khẩu.",
    emailLabel: "Email",
    emailPlaceholder: "name@example.com",
    submit: "Gửi liên kết đặt lại",
    pendingLabel: "Đang gửi…",
    errorFallback: "Gửi yêu cầu thất bại",
    sentTitle: "Đã gửi email",
    sentSubtitle: "Kiểm tra hộp thư để lấy liên kết đặt lại mật khẩu",
    sentMessagePrefix: "Liên kết đặt lại đã được gửi tới",
    sentMessageSuffix: "Liên kết có hiệu lực trong thời gian giới hạn.",
    resend: "Gửi lại email",
  },
  resetPassword: {
    heading: "Đặt mật khẩu mới",
    subtitle: "Chọn mật khẩu mạnh cho tài khoản của bạn.",
    missingToken: "Liên kết thiếu mã token. Hãy yêu cầu email đặt lại mới.",
    passwordLabel: "Mật khẩu mới",
    passwordPlaceholder: "Tối thiểu 8 ký tự",
    confirmLabel: "Xác nhận mật khẩu",
    confirmPlaceholder: "Nhập lại mật khẩu",
    passwordMismatch: "Mật khẩu xác nhận không khớp",
    submit: "Cập nhật mật khẩu",
    pendingLabel: "Đang cập nhật…",
    errorFallback: "Đặt lại mật khẩu thất bại",
    successTitle: "Đổi mật khẩu thành công",
    successSubtitle: "Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại.",
    loginNow: "Đăng nhập ngay",
  },
  verifyEmail: {
    heading: "Xác minh email",
    verifyingTitle: "Đang xác minh email…",
    verifyingSubtitle: "Vui lòng đợi trong giây lát.",
    missingToken: "Liên kết thiếu mã xác minh. Hãy mở lại liên kết trong email.",
    successTitle: "Xác minh email thành công",
    successSubtitle: "Tài khoản của bạn đã được xác minh. Hãy đăng nhập để tiếp tục.",
    loginNow: "Đăng nhập ngay",
    errorTitle: "Không thể xác minh email",
    errorSubtitle: "Liên kết không hợp lệ hoặc đã hết hạn. Hãy đăng ký lại hoặc yêu cầu gửi lại email xác minh.",
    errorFallback: "Xác minh email thất bại",
  },
  oauthCallback: {
    title: "Đang đăng nhập…",
    subtitle: "Đang hoàn tất kết nối tài khoản",
    waitMessage: "Vui lòng đợi trong giây lát.",
  },
};

const en: AuthDictionary = {
  shared: {
    continueWith: "or continue with",
    google: "Google",
    facebook: "Facebook",
    showPassword: "Show password",
    hidePassword: "Hide password",
    processing: "Processing…",
    encryptedNote: "Your information is protected & encrypted",

    requiredField: "This field is required",
    passwordTooShort: "Password must be at least 8 characters",
    passwordTooLong: "Password must be at most 100 characters",
    backToLogin: "Back to sign in",
    back: "Back",
    footer: "© 2026 Gia Sư Pro · Support · Terms",
  },
  hero: {
    brand: "Gia Sư Pro",
    tagline: "Teaching & learning management platform",
    title: "Teach smarter, manage lighter.",
    description:
      "Schedules, attendance, tuition and parent communication — all in one place. Built for tutors, students and parents.",
    statsTutors: "Trusted tutors",
    statsSessions: "Sessions every month",
    statsRating: "Parent rating",
    quote:
      "Since switching to Gia Sư Pro I stopped tracking tuition by hand. Parents scan a QR code and reconciliation is instant.",
    quoteName: "Ms. Thu Lan",
    quoteRole: "English Tutor · Hanoi",
  },
  login: {
    heading: "Sign in",
    subtitle: "Welcome back! Choose your role and sign in.",
    roleAdmin: "Tutor",
    roleStudent: "Student",
    roleParent: "Parent",
    emailLabel: "Email or phone number",
    emailPlaceholder: "quan.nguyen@giasupro.vn",
    identifierLabel: "User code or email",
    identifierPlaceholder: "Enter your user code or email",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    forgotPassword: "Forgot password?",
    submit: "Sign in",
    errorFallback: "Sign in failed",
    noAccount: "Don't have a tutor account?",
    registerNow: "Register now",
  },
  register: {
    heading: "Create account",
    subtitle: "Start managing your classes today.",
    firstNameLabel: "First name",
    firstNamePlaceholder: "John",
    lastNameLabel: "Last name",
    lastNamePlaceholder: "Doe",
    emailLabel: "Email",
    emailPlaceholder: "name@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 8 characters",
    confirmPasswordLabel: "Confirm password",
    confirmPasswordPlaceholder: "Re-enter your password",
    passwordMismatch: "Passwords do not match",
    submit: "Register",
    pendingLabel: "Creating account…",
    errorFallback: "Registration failed",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
  },
  forgotPassword: {
    heading: "Forgot password?",
    subtitle: "Enter your email to receive a reset link.",
    emailLabel: "Email",
    emailPlaceholder: "name@example.com",
    submit: "Send reset link",
    pendingLabel: "Sending…",
    errorFallback: "Failed to send request",
    sentTitle: "Email sent",
    sentSubtitle: "Check your inbox for the password reset link",
    sentMessagePrefix: "A reset link has been sent to",
    sentMessageSuffix: "The link is valid for a limited time.",
    resend: "Resend email",
  },
  resetPassword: {
    heading: "Set a new password",
    subtitle: "Choose a strong password for your account.",
    missingToken: "The link is missing a token. Please request a new reset email.",
    passwordLabel: "New password",
    passwordPlaceholder: "At least 8 characters",
    confirmLabel: "Confirm password",
    confirmPlaceholder: "Re-enter your password",
    passwordMismatch: "Passwords do not match",
    submit: "Update password",
    pendingLabel: "Updating…",
    errorFallback: "Failed to reset password",
    successTitle: "Password changed successfully",
    successSubtitle: "Your password has been updated. Please sign in again.",
    loginNow: "Sign in now",
  },
  verifyEmail: {
    heading: "Verify email",
    verifyingTitle: "Verifying your email…",
    verifyingSubtitle: "Please wait a moment.",
    missingToken: "The link is missing a verification token. Please open the link from your email again.",
    successTitle: "Email verified successfully",
    successSubtitle: "Your account has been verified. Sign in to continue.",
    loginNow: "Sign in now",
    errorTitle: "Could not verify your email",
    errorSubtitle: "The link is invalid or has expired. Please register again or request a new verification email.",
    errorFallback: "Email verification failed",
  },
  oauthCallback: {
    title: "Signing you in…",
    subtitle: "Finishing account connection",
    waitMessage: "Please wait a moment.",
  },
};

export const authDictionary: Record<Language, AuthDictionary> = { vi, en };
