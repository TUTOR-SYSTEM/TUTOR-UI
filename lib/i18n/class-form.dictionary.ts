import type { Language } from "@/types";

export type ClassFormDictionary = {
  common: {
    classNameLabel: string;
    classNamePlaceholder: string;
    classNameError: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    subjectError: string;
    formatOnlineTitle: string;
    formatOnlineDesc: string;
    formatOfflineTitle: string;
    formatOfflineDesc: string;
    onlineLocationLabel: string;
    onlineLocationPlaceholder: string;
    offlineLocationLabel: string;
    offlineLocationPlaceholder: string;
    curriculumLabel: string;
    curriculumHint: string;
    curriculumSearchPlaceholder: string;
    curriculumNoResults: string;
    curriculumGradeSuffix: (grade: string) => string;
    curriculumCodeLine: (code: string, courseTime: string) => string;
    curriculumDeselectAriaLabel: string;
    teachingType1on1Title: string;
    teachingType1on1Desc: string;
    teachingTypeGroupTitle: string;
    teachingTypeGroupDesc: string;
    studentsHintSingle: string;
    studentsHintGroup: (max: number, selected: number) => string;
    studentsSearchPlaceholder: string;
    studentsNoResults: string;
    studentFallbackName: string;
    startDateLabel: string;
    endDateLabel: string;
    endDateBeforeStartError: string;
    feePlaceholder: string;
    feeCurrencySuffix: string;
    feeRequiredError: string;
    descriptionPlaceholder: string;
    sessionsUnit: string;
    weekdayNames: Record<string, string>;
  };
  create: {
    dialogAriaLabel: string;
    title: string;
    subtitle: string;
    stepper: {
      info: string;
      formatCurriculum: string;
      scheduleTuition: string;
      students: string;
    };
    success: {
      title: string;
      messagePrefix: string;
      messageSuffix: string;
      viewDetail: string;
      createFirstSession: string;
    };
    step1: {
      classCodeLabel: string;
      classCodeAuto: string;
      gradeLabel: string;
      gradePlaceholder: string;
      gradeError: string;
      teachingTypeLabel: string;
      descriptionLabel: string;
    };
    step2: {
      formatLabel: string;
      formatHint: string;
    };
    step3: {
      scheduleSectionLabel: string;
      scheduleCountSuffix: (count: number) => string;
      scheduleRequiredError: string;
      scheduleSlotLabel: (n: number) => string;
      startTimeLabel: string;
      durationLabel: string;
      slotFormatLabel: string;
      slotLocationOfflineLabel: string;
      addSlotButton: string;
      courseDurationSectionLabel: string;
      startDateRequiredError: string;
      endDateRequiredError: string;
      totalSessionsPrefix: string;
      tuitionSectionLabel: string;
      feePerSessionLabel: string;
      paymentMethodLabel: string;
      paymentSession: string;
      paymentWeek: string;
      paymentMonth: string;
      summaryClassNamePlaceholder: string;
      summaryScheduleLabel: string;
      summarySessionsPrefix: string;
      summaryDurationPrefix: string;
      summaryPaymentPrefix: string;
      totalCostSubLabel: string;
    };
    footer: {
      next: string;
      finish: string;
      finishing: string;
    };
    toast: {
      missingFields: string;
      classIdMissing: string;
      createSuccess: string;
      createErrorFallback: string;
    };
  };
  edit: {
    dialogAriaLabel: string;
    title: string;
    subtitle: string;
    formatHint: string;
    feeLabel: string;
    statusLabel: string;
    statusOpen: string;
    statusClosed: string;
    statusUpcoming: string;
    descriptionLabel: string;
    studentsLabel: string;
    saveChanges: string;
    saving: string;
    toastSuccess: string;
    toastErrorFallback: string;
  };
};

const vi: ClassFormDictionary = {
  common: {
    classNameLabel: "Tên lớp học",
    classNamePlaceholder: "Nhập tên lớp học",
    classNameError: "Vui lòng nhập tên lớp",
    subjectLabel: "Môn học",
    subjectPlaceholder: "Chọn môn học",
    subjectError: "Vui lòng chọn môn học",
    formatOnlineTitle: "Online",
    formatOnlineDesc: "Học qua Zoom/Meet...",
    formatOfflineTitle: "Offline",
    formatOfflineDesc: "Học trực tiếp tại địa điểm",
    onlineLocationLabel: "Link học trực tuyến",
    onlineLocationPlaceholder: "Link Zoom/Meet...",
    offlineLocationLabel: "Địa chỉ lớp học",
    offlineLocationPlaceholder: "Địa chỉ lớp học...",
    curriculumLabel: "Chương trình học",
    curriculumHint:
      "Gán một khung chương trình có sẵn cho lớp (không bắt buộc).",
    curriculumSearchPlaceholder: "Tìm chương trình theo môn, khối, mã...",
    curriculumNoResults: "Không tìm thấy chương trình phù hợp",
    curriculumGradeSuffix: (grade) => ` – Khối ${grade}`,
    curriculumCodeLine: (code, courseTime) => `Mã ${code} · ${courseTime}`,
    curriculumDeselectAriaLabel: "Bỏ chọn chương trình",
    teachingType1on1Title: "1 kèm 1",
    teachingType1on1Desc: "Một học viên",
    teachingTypeGroupTitle: "Lớp nhóm",
    teachingTypeGroupDesc: "2–10 học viên",
    studentsHintSingle: "Lớp 1 kèm 1 — chọn đúng 1 học sinh",
    studentsHintGroup: (max, selected) =>
      `Lớp nhóm — chọn tối đa ${max} học sinh (${selected}/${max} đã chọn)`,
    studentsSearchPlaceholder: "Tìm học sinh theo tên...",
    studentsNoResults: "Không tìm thấy học sinh nào",
    studentFallbackName: "Học sinh",
    startDateLabel: "Ngày bắt đầu",
    endDateLabel: "Ngày kết thúc",
    endDateBeforeStartError: "Ngày kết thúc không được trước ngày bắt đầu",
    feePlaceholder: "350.000",
    feeCurrencySuffix: "đ",
    feeRequiredError: "Học phí phải lớn hơn 0",
    descriptionPlaceholder: "Mục tiêu, lộ trình, ghi chú cho lớp...",
    sessionsUnit: "buổi",
    weekdayNames: {
      T2: "Thứ 2",
      T3: "Thứ 3",
      T4: "Thứ 4",
      T5: "Thứ 5",
      T6: "Thứ 6",
      T7: "Thứ 7",
      CN: "Chủ nhật",
    },
  },
  create: {
    dialogAriaLabel: "Thêm lớp học mới",
    title: "Thêm lớp học mới",
    subtitle: "Điền thông tin theo từng bước để tạo lớp học",
    stepper: {
      info: "Thông tin",
      formatCurriculum: "Hình thức & Chương trình",
      scheduleTuition: "Lịch & Học phí",
      students: "Học sinh",
    },
    success: {
      title: "Lớp học đã được tạo!",
      messagePrefix: "Lớp",
      messageSuffix: "đã sẵn sàng hoạt động.",
      viewDetail: "Xem chi tiết lớp",
      createFirstSession: "Tạo buổi học đầu tiên",
    },
    step1: {
      classCodeLabel: "Mã lớp",
      classCodeAuto: "Tự tạo",
      gradeLabel: "Cấp lớp",
      gradePlaceholder: "Chọn cấp lớp",
      gradeError: "Vui lòng chọn cấp lớp",
      teachingTypeLabel: "Hình thức dạy",
      descriptionLabel: "Mô tả ngắn",
    },
    step2: {
      formatLabel: "Hình thức học",
      formatHint:
        "Áp dụng chung cho cả lớp, dùng làm mặc định cho các khung giờ học.",
    },
    step3: {
      scheduleSectionLabel: "Khung giờ học",
      scheduleCountSuffix: (count) => `${count} khung giờ / tuần`,
      scheduleRequiredError: "Chọn ít nhất 1 khung giờ",
      scheduleSlotLabel: (n) => `Khung giờ ${n}`,
      startTimeLabel: "Giờ bắt đầu",
      durationLabel: "Thời lượng",
      slotFormatLabel: "Hình thức",
      slotLocationOfflineLabel: "Địa điểm",
      addSlotButton: "Thêm khung giờ khác",
      courseDurationSectionLabel: "Thời gian khóa học",
      startDateRequiredError: "Chọn ngày bắt đầu",
      endDateRequiredError: "Chọn ngày kết thúc",
      totalSessionsPrefix: "Tổng số buổi",
      tuitionSectionLabel: "Học phí",
      feePerSessionLabel: "Học phí mỗi buổi",
      paymentMethodLabel: "Hình thức thu",
      paymentSession: "Theo buổi",
      paymentWeek: "Theo tuần",
      paymentMonth: "Theo tháng",
      summaryClassNamePlaceholder: "Tên lớp học",
      summaryScheduleLabel: "Khung giờ",
      summarySessionsPrefix: "Số buổi",
      summaryDurationPrefix: "Thời gian",
      summaryPaymentPrefix: "Thu",
      totalCostSubLabel: "Tổng học phí cả khóa",
    },
    footer: {
      next: "Tiếp tục",
      finish: "Hoàn tất",
      finishing: "Đang tạo...",
    },
    toast: {
      missingFields: "Vui lòng điền đầy đủ thông tin",
      classIdMissing: "Không nhận được ID lớp học từ server",
      createSuccess: "Tạo lớp học thành công!",
      createErrorFallback: "Tạo lớp học thất bại",
    },
  },
  edit: {
    dialogAriaLabel: "Chỉnh sửa lớp học",
    title: "Chỉnh sửa lớp học",
    subtitle: "Cập nhật thông tin lớp học",
    formatHint: "Áp dụng chung cho cả lớp.",
    feeLabel: "Học phí mỗi buổi (VNĐ)",
    statusLabel: "Trạng thái",
    statusOpen: "Đang mở",
    statusClosed: "Đã đóng",
    statusUpcoming: "Sắp mở",
    descriptionLabel: "Mô tả",
    studentsLabel: "Danh sách học sinh",
    saveChanges: "Lưu thay đổi",
    saving: "Đang lưu...",
    toastSuccess: "Cập nhật lớp học thành công!",
    toastErrorFallback: "Cập nhật lớp học thất bại",
  },
};

const en: ClassFormDictionary = {
  common: {
    classNameLabel: "Class name",
    classNamePlaceholder: "Enter class name",
    classNameError: "Please enter a class name",
    subjectLabel: "Subject",
    subjectPlaceholder: "Select a subject",
    subjectError: "Please select a subject",
    formatOnlineTitle: "Online",
    formatOnlineDesc: "Learn via Zoom/Meet...",
    formatOfflineTitle: "Offline",
    formatOfflineDesc: "Learn in person at a location",
    onlineLocationLabel: "Online class link",
    onlineLocationPlaceholder: "Zoom/Meet link...",
    offlineLocationLabel: "Class address",
    offlineLocationPlaceholder: "Class address...",
    curriculumLabel: "Curriculum",
    curriculumHint:
      "Assign an existing curriculum framework to the class (optional).",
    curriculumSearchPlaceholder: "Search curriculum by subject, grade, code...",
    curriculumNoResults: "No matching curriculum found",
    curriculumGradeSuffix: (grade) => ` – Grade ${grade}`,
    curriculumCodeLine: (code, courseTime) => `Code ${code} · ${courseTime}`,
    curriculumDeselectAriaLabel: "Remove selected curriculum",
    teachingType1on1Title: "1-on-1",
    teachingType1on1Desc: "One student",
    teachingTypeGroupTitle: "Group class",
    teachingTypeGroupDesc: "2–10 students",
    studentsHintSingle: "1-on-1 class — select exactly 1 student",
    studentsHintGroup: (max, selected) =>
      `Group class — select up to ${max} students (${selected}/${max} selected)`,
    studentsSearchPlaceholder: "Search students by name...",
    studentsNoResults: "No students found",
    studentFallbackName: "Student",
    startDateLabel: "Start date",
    endDateLabel: "End date",
    endDateBeforeStartError: "End date cannot be before the start date",
    feePlaceholder: "350,000",
    feeCurrencySuffix: "VND",
    feeRequiredError: "Fee must be greater than 0",
    descriptionPlaceholder: "Goals, roadmap, notes for the class...",
    sessionsUnit: "sessions",
    weekdayNames: {
      T2: "Monday",
      T3: "Tuesday",
      T4: "Wednesday",
      T5: "Thursday",
      T6: "Friday",
      T7: "Saturday",
      CN: "Sunday",
    },
  },
  create: {
    dialogAriaLabel: "Add new class",
    title: "Add new class",
    subtitle: "Fill in the information step by step to create a class",
    stepper: {
      info: "Info",
      formatCurriculum: "Format & Curriculum",
      scheduleTuition: "Schedule & Tuition",
      students: "Students",
    },
    success: {
      title: "Class created!",
      messagePrefix: "Class",
      messageSuffix: "is ready to go.",
      viewDetail: "View class details",
      createFirstSession: "Create first session",
    },
    step1: {
      classCodeLabel: "Class code",
      classCodeAuto: "Auto-generated",
      gradeLabel: "Grade level",
      gradePlaceholder: "Select grade level",
      gradeError: "Please select a grade level",
      teachingTypeLabel: "Teaching format",
      descriptionLabel: "Short description",
    },
    step2: {
      formatLabel: "Class format",
      formatHint:
        "Applies to the whole class and is used as the default for schedule slots.",
    },
    step3: {
      scheduleSectionLabel: "Schedule slots",
      scheduleCountSuffix: (count) => `${count} slots / week`,
      scheduleRequiredError: "Select at least 1 schedule slot",
      scheduleSlotLabel: (n) => `Slot ${n}`,
      startTimeLabel: "Start time",
      durationLabel: "Duration",
      slotFormatLabel: "Format",
      slotLocationOfflineLabel: "Location",
      addSlotButton: "Add another slot",
      courseDurationSectionLabel: "Course duration",
      startDateRequiredError: "Select a start date",
      endDateRequiredError: "Select an end date",
      totalSessionsPrefix: "Total sessions",
      tuitionSectionLabel: "Tuition",
      feePerSessionLabel: "Fee per session",
      paymentMethodLabel: "Payment method",
      paymentSession: "Per session",
      paymentWeek: "Per week",
      paymentMonth: "Per month",
      summaryClassNamePlaceholder: "Class name",
      summaryScheduleLabel: "Schedule",
      summarySessionsPrefix: "Sessions",
      summaryDurationPrefix: "Duration",
      summaryPaymentPrefix: "Billed",
      totalCostSubLabel: "Total course tuition",
    },
    footer: {
      next: "Continue",
      finish: "Finish",
      finishing: "Creating...",
    },
    toast: {
      missingFields: "Please fill in all required information",
      classIdMissing: "Did not receive a class ID from the server",
      createSuccess: "Class created successfully!",
      createErrorFallback: "Failed to create class",
    },
  },
  edit: {
    dialogAriaLabel: "Edit class",
    title: "Edit class",
    subtitle: "Update class information",
    formatHint: "Applies to the whole class.",
    feeLabel: "Fee per session (VND)",
    statusLabel: "Status",
    statusOpen: "Open",
    statusClosed: "Closed",
    statusUpcoming: "Upcoming",
    descriptionLabel: "Description",
    studentsLabel: "Student list",
    saveChanges: "Save changes",
    saving: "Saving...",
    toastSuccess: "Class updated successfully!",
    toastErrorFallback: "Failed to update class",
  },
};

export const classFormDictionary: Record<Language, ClassFormDictionary> = {
  vi,
  en,
};
