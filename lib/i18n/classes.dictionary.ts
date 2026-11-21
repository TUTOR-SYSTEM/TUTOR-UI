import type { Language } from "@/types";

export type ClassesDictionary = {
  list: {
    pageTitle: string;
    classCount: (n: number) => string;
    addClass: string;
    stats: {
      activeClasses: { label: string; suffix: string };
      totalStudents: { label: string; suffix: string };
      sessionsPerWeek: { label: string; suffix: string };
      pendingFee: { label: string; suffix: string };
    };
    filters: {
      subjectLabel: string;
      statusLabel: string;
      allSubjects: string;
      allStatuses: string;
    };
    status: {
      active: string;
      paused: string;
      upcoming: string;
    };
    showing: {
      prefix: string;
      suffix: string;
    };
    table: {
      columns: {
        stt: string;
        className: string;
        subject: string;
        fee: string;
        students: string;
        schedule: string;
        actions: string;
      };
      classCodePrefix: string;
      perSessionSuffix: string;
      noStudents: string;
      studentFallbackAbbr: string;
      studentOverflow: (n: number) => string;
      noSchedule: string;
      weekdayNames: Record<string, string>;
      loading: string;
      loadError: string;
      empty: string;
    };
    million: string;
  };
  detail: {
    breadcrumb: string;
    loadError: string;
    backToList: string;
    newSession: string;
    stats: {
      totalSessions: { label: string; suffix: string };
      totalStudents: { label: string; suffix: string };
    };
    curriculum: {
      heading: string;
      noCurriculum: string;
      noLessons: string;
      more: (n: number) => string;
      viewDetail: string;
    };
    assignments: {
      heading: string;
      empty: string;
      itemPrefix: (n: number) => string;
      newBadge: string;
      countSuffix: (n: number) => string;
      more: (n: number) => string;
      manage: string;
    };
    students: {
      heading: string;
      searchPlaceholder: string;
      export: string;
      empty: string;
      columns: {
        stt: string;
        student: string;
        studentCode: string;
        studentPhone: string;
        parent: string;
        parentPhone: string;
      };
      noMatch: string;
      viewAll: (n: number) => string;
    };
    sessions: {
      selectAllAria: string;
      selectRowAria: (n: number) => string;
      columns: {
        stt: string;
        date: string;
        time: string;
        lessonContent: string;
        status: string;
        actions: string;
      };
      defaultLessonTitle: string;
      chapterPrefix: string;
      detailAria: string;
      upcomingTitle: string;
      pastTitle: string;
      upcomingEmpty: string;
      pastEmpty: string;
      changeStatus: string;
      changeStatusPlaceholder: string;
      noSelection: string;
      changeStatusSuccess: string;
      changeStatusError: string;
      deleteSuccess: string;
      deleteError: string;
    };
    sessionStatus: {
      scheduled: string;
      ongoing: string;
      postponed: string;
      completed: string;
      cancelled: string;
    };
    learnStatus: {
      learned: string;
      learning: string;
      notStarted: string;
    };
    classStatus: {
      active: string;
      upcoming: string;
      completed: string;
    };
    changeClassStatus: {
      ariaLabel: string;
      success: string;
      error: string;
    };
  };
  deleteDialog: {
    success: string;
    error: string;
    confirmPrefix: string;
    confirmSuffix: string;
    warning: string;
  };
  usageGuide: {
    title: string;
    steps: {
      addClass: { title: string; body: string };
      filter: { title: string; body: string };
      viewDetail: { title: string; body: string };
      editDelete: { title: string; body: string };
    };
    warning: string;
  };
};

const vi: ClassesDictionary = {
  list: {
    pageTitle: "Quản lý lớp học",
    classCount: (n) => `${n} lớp học`,
    addClass: "Thêm lớp học",
    stats: {
      activeClasses: { label: "Lớp đang mở", suffix: "lớp" },
      totalStudents: { label: "Tổng học sinh", suffix: "học sinh" },
      sessionsPerWeek: { label: "Buổi học / tuần", suffix: "buổi" },
      pendingFee: { label: "Học phí chờ thu", suffix: "tr đ" },
    },
    filters: {
      subjectLabel: "Môn học",
      statusLabel: "Trạng thái",
      allSubjects: "Tất cả môn học",
      allStatuses: "Tất cả trạng thái",
    },
    status: {
      active: "Đang mở",
      paused: "Đã nghỉ",
      upcoming: "Sắp mở",
    },
    showing: {
      prefix: "Hiển thị",
      suffix: "lớp học",
    },
    table: {
      columns: {
        stt: "Thứ tự",
        className: "Tên lớp",
        subject: "Môn học",
        fee: "Học phí",
        students: "Học sinh",
        schedule: "Lịch học",
        actions: "Thao tác",
      },
      classCodePrefix: "Mã lớp:",
      perSessionSuffix: "/buổi",
      noStudents: "Chưa có học sinh",
      studentFallbackAbbr: "HS",
      studentOverflow: (n) => `+${n} học sinh`,
      noSchedule: "Chưa có lịch",
      weekdayNames: {
        MONDAY: "Thứ 2",
        TUESDAY: "Thứ 3",
        WEDNESDAY: "Thứ 4",
        THURSDAY: "Thứ 5",
        FRIDAY: "Thứ 6",
        SATURDAY: "Thứ 7",
        SUNDAY: "Chủ nhật",
      },
      loading: "Đang tải danh sách lớp học...",
      loadError: "Không tải được danh sách lớp học.",
      empty: "Không có lớp học nào phù hợp.",
    },
    million: "tr đ",
  },
  detail: {
    breadcrumb: "Quản lý lớp học",
    loadError: "Không thể tải thông tin lớp học",
    backToList: "Quay lại danh sách lớp",
    newSession: "Buổi mới",
    stats: {
      totalSessions: { label: "Tổng số buổi", suffix: "tổng cộng" },
      totalStudents: { label: "Số học sinh", suffix: "đang tham gia" },
    },
    curriculum: {
      heading: "Chương trình bài giảng",
      noCurriculum: "Chưa gắn chương trình học",
      noLessons: "Chưa có bài giảng nào",
      more: (n) => `+${n} bài giảng khác`,
      viewDetail: "Xem chi tiết →",
    },
    assignments: {
      heading: "Bài tập bắt buộc",
      empty: "Chưa có bài tập bắt buộc",
      itemPrefix: (n) => `BT${n}:`,
      newBadge: "Mới",
      countSuffix: (n) => `${n} bài`,
      more: (n) => `+${n} mục khác`,
      manage: "Quản lý bài tập →",
    },
    students: {
      heading: "Danh sách học sinh",
      searchPlaceholder: "Tìm học sinh...",
      export: "Xuất danh sách",
      empty: "Chưa có học sinh",
      columns: {
        stt: "Thứ tự",
        student: "Học sinh",
        studentCode: "Mã học sinh",
        studentPhone: "SĐT học sinh",
        parent: "Phụ huynh",
        parentPhone: "SĐT phụ huynh",
      },
      noMatch: "Không tìm thấy học sinh phù hợp",
      viewAll: (n) => `Xem tất cả ${n} học sinh →`,
    },
    sessions: {
      selectAllAria: "Chọn tất cả",
      selectRowAria: (n) => `Chọn buổi ${n}`,
      columns: {
        stt: "Thứ tự",
        date: "Ngày học",
        time: "Thời gian",
        lessonContent: "Nội dung bài học",
        status: "Trạng thái",
        actions: "Thao tác",
      },
      defaultLessonTitle: "Tên bài học",
      chapterPrefix: "Chương:",
      detailAria: "Chi tiết buổi học",
      upcomingTitle: "Buổi học sắp tới",
      pastTitle: "Buổi học đã qua",
      upcomingEmpty: "Chưa có buổi học sắp tới",
      pastEmpty: "Chưa có buổi học đã qua",
      changeStatus: "Đổi trạng thái",
      changeStatusPlaceholder: "Chọn trạng thái...",
      noSelection: "Chưa chọn buổi học nào",
      changeStatusSuccess: "Đã cập nhật trạng thái buổi học đã chọn",
      changeStatusError: "Cập nhật trạng thái thất bại",
      deleteSuccess: "Đã xóa buổi học đã chọn",
      deleteError: "Xóa buổi học thất bại",
    },
    sessionStatus: {
      scheduled: "Sắp diễn ra",
      ongoing: "Đang diễn ra",
      postponed: "Tạm hoãn",
      completed: "Kết thúc",
      cancelled: "Đã hủy",
    },
    learnStatus: {
      learned: "Hoàn thành",
      learning: "Đang học",
      notStarted: "Sắp tới",
    },
    classStatus: {
      active: "Đang học",
      upcoming: "Sắp mở",
      completed: "Hoàn thành",
    },
    changeClassStatus: {
      ariaLabel: "Đổi trạng thái lớp",
      success: "Cập nhật trạng thái lớp thành công",
      error: "Không thể cập nhật trạng thái lớp",
    },
  },
  deleteDialog: {
    success: "Xóa lớp học thành công!",
    error: "Xóa lớp học thất bại",
    confirmPrefix: "Bạn có chắc muốn xóa lớp học",
    confirmSuffix: "?",
    warning:
      "Toàn bộ dữ liệu liên quan đến lớp học này cũng sẽ bị gỡ. Hành động này không thể hoàn tác.",
  },
  usageGuide: {
    title: "Hướng dẫn sử dụng",
    steps: {
      addClass: {
        title: "Thêm lớp mới",
        body: 'Nhấn nút "+ Thêm" ở góc trên để tạo lớp, chọn môn học, học phí và chương trình học.',
      },
      filter: {
        title: "Lọc theo môn & trạng thái",
        body: "Dùng 2 ô chọn ở đầu bảng để thu hẹp danh sách theo môn học hoặc trạng thái lớp.",
      },
      viewDetail: {
        title: "Xem chi tiết lớp",
        body: "Nhấn vào tên lớp để mở trang chi tiết: học sinh, buổi học, lịch dạy.",
      },
      editDelete: {
        title: "Sửa hoặc xoá",
        body: "Dùng biểu tượng bút để chỉnh sửa thông tin lớp, biểu tượng thùng rác để xoá lớp khỏi danh sách.",
      },
    },
    warning:
      'Lưu ý: Chấm màu ở đầu mỗi dòng và ở chú thích cuối bảng thể hiện trạng thái lớp — xanh: đang hoạt động, đỏ: tạm dừng, xám: sắp khai giảng.',
  },
};

const en: ClassesDictionary = {
  list: {
    pageTitle: "Class management",
    classCount: (n) => `${n} classes`,
    addClass: "Add class",
    stats: {
      activeClasses: { label: "Active classes", suffix: "classes" },
      totalStudents: { label: "Total students", suffix: "students" },
      sessionsPerWeek: { label: "Sessions / week", suffix: "sessions" },
      pendingFee: { label: "Pending tuition", suffix: "M VND" },
    },
    filters: {
      subjectLabel: "Subject",
      statusLabel: "Status",
      allSubjects: "All subjects",
      allStatuses: "All statuses",
    },
    status: {
      active: "Active",
      paused: "Paused",
      upcoming: "Upcoming",
    },
    showing: {
      prefix: "Showing",
      suffix: "classes",
    },
    table: {
      columns: {
        stt: "No.",
        className: "Class name",
        subject: "Subject",
        fee: "Tuition",
        students: "Students",
        schedule: "Schedule",
        actions: "Actions",
      },
      classCodePrefix: "Class code:",
      perSessionSuffix: "/session",
      noStudents: "No students yet",
      studentFallbackAbbr: "ST",
      studentOverflow: (n) => `+${n} students`,
      noSchedule: "No schedule yet",
      weekdayNames: {
        MONDAY: "Monday",
        TUESDAY: "Tuesday",
        WEDNESDAY: "Wednesday",
        THURSDAY: "Thursday",
        FRIDAY: "Friday",
        SATURDAY: "Saturday",
        SUNDAY: "Sunday",
      },
      loading: "Loading class list...",
      loadError: "Unable to load class list.",
      empty: "No matching classes.",
    },
    million: "M VND",
  },
  detail: {
    breadcrumb: "Class management",
    loadError: "Unable to load class information",
    backToList: "Back to class list",
    newSession: "New session",
    stats: {
      totalSessions: { label: "Total sessions", suffix: "in total" },
      totalStudents: { label: "Number of students", suffix: "enrolled" },
    },
    curriculum: {
      heading: "Curriculum",
      noCurriculum: "No curriculum linked yet",
      noLessons: "No lessons yet",
      more: (n) => `+${n} more lessons`,
      viewDetail: "View details →",
    },
    assignments: {
      heading: "Required assignments",
      empty: "No required assignments yet",
      itemPrefix: (n) => `HW${n}:`,
      newBadge: "New",
      countSuffix: (n) => `${n} items`,
      more: (n) => `+${n} more items`,
      manage: "Manage assignments →",
    },
    students: {
      heading: "Student list",
      searchPlaceholder: "Search students...",
      export: "Export list",
      empty: "No students yet",
      columns: {
        stt: "No.",
        student: "Student",
        studentCode: "Student code",
        studentPhone: "Student phone",
        parent: "Parent",
        parentPhone: "Parent phone",
      },
      noMatch: "No matching students found",
      viewAll: (n) => `View all ${n} students →`,
    },
    sessions: {
      selectAllAria: "Select all",
      selectRowAria: (n) => `Select session ${n}`,
      columns: {
        stt: "No.",
        date: "Date",
        time: "Time",
        lessonContent: "Lesson content",
        status: "Status",
        actions: "Actions",
      },
      defaultLessonTitle: "Lesson title",
      chapterPrefix: "Chapter:",
      detailAria: "Session details",
      upcomingTitle: "Upcoming sessions",
      pastTitle: "Past sessions",
      upcomingEmpty: "No upcoming sessions yet",
      pastEmpty: "No past sessions yet",
      changeStatus: "Change status",
      changeStatusPlaceholder: "Select status...",
      noSelection: "No sessions selected",
      changeStatusSuccess: "Status updated for selected sessions",
      changeStatusError: "Failed to update status",
      deleteSuccess: "Selected sessions deleted",
      deleteError: "Failed to delete session",
    },
    sessionStatus: {
      scheduled: "Scheduled",
      ongoing: "Ongoing",
      postponed: "Postponed",
      completed: "Finished",
      cancelled: "Cancelled",
    },
    learnStatus: {
      learned: "Completed",
      learning: "In progress",
      notStarted: "Upcoming",
    },
    classStatus: {
      active: "Active",
      upcoming: "Upcoming",
      completed: "Completed",
    },
    changeClassStatus: {
      ariaLabel: "Change class status",
      success: "Class status updated successfully",
      error: "Unable to update class status",
    },
  },
  deleteDialog: {
    success: "Class deleted successfully!",
    error: "Failed to delete class",
    confirmPrefix: "Are you sure you want to delete class",
    confirmSuffix: "?",
    warning:
      "All data related to this class will also be removed. This action cannot be undone.",
  },
  usageGuide: {
    title: "Usage guide",
    steps: {
      addClass: {
        title: "Add a new class",
        body: 'Click the "+ Add" button at the top to create a class, choose subject, tuition, and curriculum.',
      },
      filter: {
        title: "Filter by subject & status",
        body: "Use the two dropdowns at the top of the table to narrow the list by subject or class status.",
      },
      viewDetail: {
        title: "View class details",
        body: "Click on a class name to open the detail page: students, sessions, schedule.",
      },
      editDelete: {
        title: "Edit or delete",
        body: "Use the pencil icon to edit class information, the trash icon to remove a class from the list.",
      },
    },
    warning:
      "Note: The colored dot at the start of each row and in the legend at the bottom indicates class status — green: active, red: paused, gray: upcoming.",
  },
};

export const classesDictionary: Record<Language, ClassesDictionary> = { vi, en };
