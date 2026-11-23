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
    curriculum: string;
    grades: string;
    sessions: string;
    tutors: string;
    allClasses: string;
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
    allClasses: string;
    students: string;
    fees: string;
    discussions: string;
    aiChat: string;
    users: string;
    reports: string;
    settings: string;
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
    curriculum: "Chương trình học",
    grades: "Bài tập về nhà",
    sessions: "Buổi học",
    tutors: "Gia sư",
    allClasses: "Tất cả lớp học",
  },
  nav: {
    overview: "Tổng quan",
    schedule: "Lịch học",
    notifications: "Thông báo",
    classes: "Lớp học",
    sessions: "Buổi học",
    curriculum: "Chương trình",
    grades: "Bài tập về nhà",
    tutors: "Gia sư",
    allClasses: "Tất cả lớp học",
    students: "Học sinh",
    fees: "Học phí",
    discussions: "Tin nhắn",
    aiChat: "AI Trợ lý",
    users: "Người dùng",
    reports: "Báo cáo học tập",
    settings: "Cài đặt",
    curriculumOfChild: "Chương trình của con",
    gradesOfChild: "Bài tập của con",
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
    curriculum: "Curriculum",
    grades: "Homework",
    sessions: "Sessions",
    tutors: "Tutors",
    allClasses: "All classes",
  },
  nav: {
    overview: "Overview",
    schedule: "Schedule",
    notifications: "Notifications",
    classes: "Classes",
    sessions: "Sessions",
    curriculum: "Curriculum",
    grades: "Homework",
    tutors: "Tutors",
    allClasses: "All classes",
    students: "Students",
    fees: "Tuition",
    discussions: "Messages",
    aiChat: "AI Assistant",
    users: "Users",
    reports: "Progress Reports",
    settings: "Settings",
    curriculumOfChild: "Child's Curriculum",
    gradesOfChild: "Child's Homework",
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
