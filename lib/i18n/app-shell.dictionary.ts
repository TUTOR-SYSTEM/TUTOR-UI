import type { Language } from "@/types";

export type AppShellDictionary = {
  brand: {
    name: string;
    tagline: string;
  };
  pageTitles: {
    overview: string;
    schedule: string;
    notifications: string;
    classes: string;
    students: string;
    fees: string;
    discussions: string;
    aiChat: string;
    practiceExams: string;
    settings: string;
  };
  nav: {
    overview: string;
    schedule: string;
    notifications: string;
    classes: string;
    sessions: string;
    curriculum: string;
    grades: string;
    tutors: string;
    students: string;
    fees: string;
    discussions: string;
    aiChat: string;
    users: string;
    reports: string;
    settings: string;
    flowRequests: string;
    logger: string;
    testMonitor: string;
    curriculumOfChild: string;
    gradesOfChild: string;
  };
  roleLabels: {
    ADMIN: string;
    TUTOR: string;
    STUDENT: string;
    PARENT: string;
  };
  userMenu: {
    defaultName: string;
    settings: string;
    signOut: string;
  };
  header: {
    toggleTheme: string;
    colorTheme: string;
    language: string;
  };
  themePicker: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    defaultName: string;
    defaultDescription: string;
    closeDialog: string;
    footerBy: string;
    footerSaved: string;
  };
};

const vi: AppShellDictionary = {
  brand: {
    name: "Gia Sư Pro",
    tagline: "Bảng điều khiển",
  },
  pageTitles: {
    overview: "Tổng quan",
    schedule: "Lịch học",
    notifications: "Thông báo",
    classes: "Lớp học",
    students: "Học sinh",
    fees: "Học phí",
    discussions: "Tin nhắn",
    aiChat: "AI Trợ lý",
    practiceExams: "Ôn tập & Thi thử",
    settings: "Cài đặt",
  },
  nav: {
    overview: "Tổng quan",
    schedule: "Lịch học",
    notifications: "Thông báo",
    classes: "Lớp học",
    sessions: "Buổi học",
    curriculum: "Chương trình",
    grades: "Điểm số",
    tutors: "Gia sư",
    students: "Học sinh",
    fees: "Học phí",
    discussions: "Tin nhắn",
    aiChat: "AI Trợ lý",
    users: "Người dùng",
    reports: "Báo cáo học tập",
    settings: "Cài đặt",
    flowRequests: "Flow Requests",
    logger: "Nhật ký request",
    testMonitor: "Kiểm thử endpoint",
    curriculumOfChild: "Chương trình của con",
    gradesOfChild: "Điểm số của con",
  },
  roleLabels: {
    ADMIN: "Quản trị viên",
    TUTOR: "Gia sư",
    STUDENT: "Học sinh",
    PARENT: "Phụ huynh",
  },
  userMenu: {
    defaultName: "Người dùng",
    settings: "Cài đặt",
    signOut: "Đăng xuất",
  },
  header: {
    toggleTheme: "Chuyển giao diện",
    colorTheme: "Màu chủ đề",
    language: "Ngôn ngữ",
  },
  themePicker: {
    title: "Giao diện",
    subtitle: "Chọn màu chủ đề cho ứng dụng",
    searchPlaceholder: "Tìm chủ đề...",
    defaultName: "Mặc định",
    defaultDescription: "Tông màu đất nung ấm áp",
    closeDialog: "Đóng hộp thoại",
    footerBy: "Chủ đề bởi",
    footerSaved: "Được lưu cục bộ trên trình duyệt của bạn.",
  },
};

const en: AppShellDictionary = {
  brand: {
    name: "Gia Sư Pro",
    tagline: "Dashboard",
  },
  pageTitles: {
    overview: "Overview",
    schedule: "Schedule",
    notifications: "Notifications",
    classes: "Classes",
    students: "Students",
    fees: "Tuition",
    discussions: "Messages",
    aiChat: "AI Assistant",
    practiceExams: "Practice & Exams",
    settings: "Settings",
  },
  nav: {
    overview: "Overview",
    schedule: "Schedule",
    notifications: "Notifications",
    classes: "Classes",
    sessions: "Sessions",
    curriculum: "Curriculum",
    grades: "Grades",
    tutors: "Tutors",
    students: "Students",
    fees: "Tuition",
    discussions: "Messages",
    aiChat: "AI Assistant",
    users: "Users",
    reports: "Progress Reports",
    settings: "Settings",
    flowRequests: "Flow Requests",
    logger: "Request logs",
    testMonitor: "Endpoint testing",
    curriculumOfChild: "Child's Curriculum",
    gradesOfChild: "Child's Grades",
  },
  roleLabels: {
    ADMIN: "Administrator",
    TUTOR: "Tutor",
    STUDENT: "Student",
    PARENT: "Parent",
  },
  userMenu: {
    defaultName: "User",
    settings: "Settings",
    signOut: "Sign out",
  },
  header: {
    toggleTheme: "Toggle theme",
    colorTheme: "Color theme",
    language: "Language",
  },
  themePicker: {
    title: "Appearance",
    subtitle: "Choose a color theme for the interface",
    searchPlaceholder: "Search themes...",
    defaultName: "Default",
    defaultDescription: "Warm terracotta tones",
    closeDialog: "Close dialog",
    footerBy: "Theme by",
    footerSaved: "Saved locally in your browser.",
  },
};

export const appShellDictionary: Record<Language, AppShellDictionary> = {
  vi,
  en,
};
