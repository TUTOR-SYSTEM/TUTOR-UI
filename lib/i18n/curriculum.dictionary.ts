import type { Language } from "@/types";

export type CurriculumDictionary = {
  header: {
    title: string;
    countSuffix: (count: number) => string;
    searchPlaceholder: string;
    searchButton: string;
    create: string;
  };
  table: {
    stt: string;
    program: string;
    codePrefix: string;
    gradePrefix: (grade: string) => string;
    courseTime: string;
    summaryHeader: string;
    summary: (chapterCount: number, lessonCount: number) => string;
    createdAt: string;
    actions: string;
    edit: string;
    delete: string;
    viewDetail: string;
  };
  list: {
    loadErrorFallback: string;
    emptySearch: string;
    emptyDefault: string;
    createFirst: string;
  };
  formDialog: {
    editTitle: string;
    createTitle: string;
    subtitle: string;
    cancel: string;
    saveChanges: string;
    create: string;
    previewFallbackSubject: string;
    previewYearPrefix: string;
    previewLabel: string;
    sectionClassification: string;
    sectionIdentityYear: string;
    sectionDescription: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    gradeLabel: string;
    gradePlaceholder: string;
    codeLabel: string;
    codeHint: string;
    codeGeneratingPlaceholder: string;
    codePlaceholder: string;
    yearLabel: string;
    descriptionPlaceholder: string;
    toastCreateSuccess: string;
    toastUpdateSuccess: string;
    toastCreateErrorFallback: string;
    toastUpdateErrorFallback: string;
    errSubjectRequired: string;
    errMax255: string;
    errCodeRequired: string;
    errMax50: string;
    errGradeRequired: string;
    errCourseTimeRequired: string;
    errMax2000: string;
  };
  deleteDialog: {
    confirmLabel: string;
    descriptionPrefix: string;
    descriptionFallbackSubject: string;
    descriptionWarning: string;
    toastSuccess: string;
    toastErrorFallback: string;
  };
  detail: {
    breadcrumbBack: string;
    header: {
      chapterCountSuffix: (count: number) => string;
      createChapterButton: string;
    };
    table: {
      stt: string;
      lessonName: string;
      lessonCode: string;
      actions: string;
    };
    empty: {
      title: string;
      hint: string;
    };
    error: {
      loadFallback: string;
      retry: string;
    };
    file: {
      removeAriaLabel: string;
      downloadAriaLabel: string;
      addButton: string;
      theoryBadge: string;
      exerciseBadge: string;
      downloadErrorFallback: string;
      removeErrorFallback: string;
    };
    lesson: {
      expandAriaLabel: string;
      deleteAriaLabel: string;
      titlePlaceholder: string;
      descriptionPlaceholder: string;
      addButton: string;
      cancelButton: string;
      addToChapterPrefix: string;
      uploadSuccess: string;
      uploadErrorFallback: string;
      removeFileSuccess: string;
    };
    chapter: {
      label: (index: number, title: string) => string;
      lessonCountSuffix: (count: number) => string;
      deleteAriaLabel: string;
      addLessonSuccess: string;
      addLessonErrorFallback: string;
      addLessonButton: string;
      deleteLessonSuccess: string;
      deleteLessonErrorFallback: string;
    };
    createChapterModal: {
      title: string;
      nameLabel: string;
      namePlaceholder: string;
      nameRequired: string;
      descriptionLabel: string;
      descriptionOptionalHint: string;
      descriptionPlaceholder: string;
      cancelButton: string;
      submitButton: string;
      toastSuccess: string;
      toastErrorFallback: string;
    };
    deleteChapterToastSuccess: string;
    deleteChapterToastErrorFallback: string;
  };
};

const vi: CurriculumDictionary = {
  header: {
    title: "Chương trình học",
    countSuffix: (count) => `${count} khung chương trình`,
    searchPlaceholder: "Tìm chương trình, mã...",
    searchButton: "Tìm kiếm",
    create: "Tạo chương trình",
  },
  table: {
    stt: "STT",
    program: "Chương trình",
    codePrefix: "Mã",
    gradePrefix: (grade) => ` – Khối ${grade}`,
    courseTime: "Năm học",
    summaryHeader: "Nội dung",
    summary: (chapters, lessons) => `${chapters} chương · ${lessons} bài`,
    createdAt: "Ngày tạo",
    actions: "Thao tác",
    edit: "Chỉnh sửa",
    delete: "Xóa",
    viewDetail: "Xem chi tiết",
  },
  list: {
    loadErrorFallback: "Không thể tải danh sách chương trình.",
    emptySearch: "Không tìm thấy chương trình phù hợp",
    emptyDefault: "Chưa có chương trình nào",
    createFirst: "Tạo chương trình đầu tiên",
  },
  formDialog: {
    editTitle: "Chỉnh sửa chương trình",
    createTitle: "Tạo chương trình mới",
    subtitle: "Khai báo khung chương trình để bắt đầu xây dựng lộ trình bài giảng.",
    cancel: "Hủy",
    saveChanges: "Lưu thay đổi",
    create: "Tạo chương trình",
    previewFallbackSubject: "Môn học",
    previewYearPrefix: "Năm học ",
    previewLabel: "Xem trước",
    sectionClassification: "Phân loại",
    sectionIdentityYear: "Định danh & năm học",
    sectionDescription: "Mô tả",
    subjectLabel: "Môn học",
    subjectPlaceholder: "VD: Toán Giải Tích",
    gradeLabel: "Khối",
    gradePlaceholder: "VD: 10",
    codeLabel: "Mã môn",
    codeHint: "hệ thống tự sinh, dùng để sinh mã bài học",
    codeGeneratingPlaceholder: "Đang tạo mã...",
    codePlaceholder: "VD: MAT101",
    yearLabel: "Năm học",
    descriptionPlaceholder:
      "Mô tả mục tiêu, đối tượng và phạm vi của chương trình... (không bắt buộc)",
    toastCreateSuccess: "Đã tạo chương trình mới",
    toastUpdateSuccess: "Đã cập nhật chương trình",
    toastCreateErrorFallback: "Tạo chương trình thất bại",
    toastUpdateErrorFallback: "Cập nhật thất bại",
    errSubjectRequired: "Vui lòng nhập môn học",
    errMax255: "Tối đa 255 ký tự",
    errCodeRequired: "Vui lòng nhập mã môn",
    errMax50: "Tối đa 50 ký tự",
    errGradeRequired: "Vui lòng nhập khối",
    errCourseTimeRequired: "Vui lòng chọn năm học",
    errMax2000: "Tối đa 2000 ký tự",
  },
  deleteDialog: {
    confirmLabel: "Xóa chương trình",
    descriptionPrefix: "Xóa ",
    descriptionFallbackSubject: "—",
    descriptionWarning:
      "Hành động này không thể hoàn tác và sẽ xóa tất cả chương và bài học liên quan.",
    toastSuccess: "Đã xóa chương trình",
    toastErrorFallback: "Xóa thất bại",
  },
  detail: {
    breadcrumbBack: "Chương trình học",
    header: {
      chapterCountSuffix: (count) => `${count} chương`,
      createChapterButton: "Tạo chương mới",
    },
    table: {
      stt: "STT",
      lessonName: "Tên bài",
      lessonCode: "Mã bài",
      actions: "Thao tác",
    },
    empty: {
      title: "Chưa có chương nào",
      hint: 'Nhấn "Tạo chương mới" để bắt đầu.',
    },
    error: {
      loadFallback: "Không thể tải chương trình",
      retry: "Thử lại",
    },
    file: {
      removeAriaLabel: "Xóa tệp",
      downloadAriaLabel: "Tải xuống",
      addButton: "Thêm tệp",
      theoryBadge: "Bài giảng",
      exerciseBadge: "Bài tập",
      downloadErrorFallback: "Tải tệp thất bại",
      removeErrorFallback: "Xóa tệp thất bại",
    },
    lesson: {
      expandAriaLabel: "Mở rộng",
      deleteAriaLabel: "Xóa bài",
      titlePlaceholder: "Tên bài học...",
      descriptionPlaceholder: "Mô tả (tuỳ chọn)...",
      addButton: "Thêm",
      cancelButton: "Huỷ",
      addToChapterPrefix: "Thêm bài vào ",
      uploadSuccess: "Đã tải tệp lên",
      uploadErrorFallback: "Tải tệp thất bại",
      removeFileSuccess: "Đã xóa tệp",
    },
    chapter: {
      // Tên đã có sẵn "Chương N" thì không thêm tiền tố nữa (tránh "Chương 1 · Chương 1 ...").
      label: (index, title) =>
        /^chương\s*\d/i.test(title.trim()) ? title : `Chương ${index} · ${title}`,
      lessonCountSuffix: (count) => `${count} bài`,
      deleteAriaLabel: "Xóa chương",
      addLessonSuccess: "Đã thêm bài học",
      addLessonErrorFallback: "Thêm bài thất bại",
      addLessonButton: "+ Thêm bài học",
      deleteLessonSuccess: "Đã xóa bài học",
      deleteLessonErrorFallback: "Xóa bài thất bại",
    },
    createChapterModal: {
      title: "Tạo chương mới",
      nameLabel: "Tên chương",
      namePlaceholder: "Ví dụ: Đại số tuyến tính...",
      nameRequired: "Vui lòng nhập tên chương",
      descriptionLabel: "Mô tả",
      descriptionOptionalHint: "(tuỳ chọn)",
      descriptionPlaceholder: "Mô tả nội dung chương...",
      cancelButton: "Huỷ",
      submitButton: "Tạo chương",
      toastSuccess: "Đã tạo chương mới",
      toastErrorFallback: "Tạo chương thất bại",
    },
    deleteChapterToastSuccess: "Đã xóa chương",
    deleteChapterToastErrorFallback: "Xóa chương thất bại",
  },
};

const en: CurriculumDictionary = {
  header: {
    title: "Curriculum",
    countSuffix: (count) => `${count} frameworks`,
    searchPlaceholder: "Search program, code...",
    searchButton: "Search",
    create: "Create program",
  },
  table: {
    stt: "No.",
    program: "Program",
    codePrefix: "Code",
    gradePrefix: (grade) => ` – Grade ${grade}`,
    courseTime: "Course time",
    summaryHeader: "Content",
    summary: (chapters, lessons) => `${chapters} chapters · ${lessons} lessons`,
    createdAt: "Created at",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    viewDetail: "View detail",
  },
  list: {
    loadErrorFallback: "Failed to load curriculum frameworks.",
    emptySearch: "No matching curriculum found",
    emptyDefault: "No curriculum frameworks yet",
    createFirst: "Create your first curriculum",
  },
  formDialog: {
    editTitle: "Edit curriculum",
    createTitle: "Create new curriculum",
    subtitle: "Set up a curriculum framework to start building the lesson roadmap.",
    cancel: "Cancel",
    saveChanges: "Save changes",
    create: "Create program",
    previewFallbackSubject: "Subject",
    previewYearPrefix: "Course time ",
    previewLabel: "Preview",
    sectionClassification: "Classification",
    sectionIdentityYear: "Identity & course time",
    sectionDescription: "Description",
    subjectLabel: "Subject",
    subjectPlaceholder: "e.g. Calculus",
    gradeLabel: "Grade",
    gradePlaceholder: "e.g. 10",
    codeLabel: "Subject code",
    codeHint: "auto-generated, used to generate lesson codes",
    codeGeneratingPlaceholder: "Generating code...",
    codePlaceholder: "e.g. MAT101",
    yearLabel: "Course time",
    descriptionPlaceholder:
      "Describe the goal, audience, and scope of the program... (optional)",
    toastCreateSuccess: "Curriculum created",
    toastUpdateSuccess: "Curriculum updated",
    toastCreateErrorFallback: "Failed to create curriculum",
    toastUpdateErrorFallback: "Update failed",
    errSubjectRequired: "Please enter the subject",
    errMax255: "255 characters max",
    errCodeRequired: "Please enter the subject code",
    errMax50: "50 characters max",
    errGradeRequired: "Please enter the grade",
    errCourseTimeRequired: "Please choose a course time",
    errMax2000: "2000 characters max",
  },
  deleteDialog: {
    confirmLabel: "Delete curriculum",
    descriptionPrefix: "Delete ",
    descriptionFallbackSubject: "—",
    descriptionWarning:
      "This action cannot be undone and will delete all related chapters and lessons.",
    toastSuccess: "Curriculum deleted",
    toastErrorFallback: "Delete failed",
  },
  detail: {
    breadcrumbBack: "Curriculum",
    header: {
      chapterCountSuffix: (count) => `${count} chapters`,
      createChapterButton: "New chapter",
    },
    table: {
      stt: "No.",
      lessonName: "Lesson name",
      lessonCode: "Lesson code",
      actions: "Actions",
    },
    empty: {
      title: "No chapters yet",
      hint: 'Click "New chapter" to get started.',
    },
    error: {
      loadFallback: "Failed to load curriculum",
      retry: "Retry",
    },
    file: {
      removeAriaLabel: "Remove file",
      downloadAriaLabel: "Download",
      addButton: "Add file",
      theoryBadge: "Theory",
      exerciseBadge: "Exercise",
      downloadErrorFallback: "Failed to download file",
      removeErrorFallback: "Failed to remove file",
    },
    lesson: {
      expandAriaLabel: "Expand",
      deleteAriaLabel: "Delete lesson",
      titlePlaceholder: "Lesson title...",
      descriptionPlaceholder: "Description (optional)...",
      addButton: "Add",
      cancelButton: "Cancel",
      addToChapterPrefix: "Add lesson to ",
      uploadSuccess: "File uploaded",
      uploadErrorFallback: "Failed to upload file",
      removeFileSuccess: "File removed",
    },
    chapter: {
      label: (index, title) =>
        /^chapter\s*\d/i.test(title.trim()) ? title : `Chapter ${index} · ${title}`,
      lessonCountSuffix: (count) => `${count} lessons`,
      deleteAriaLabel: "Delete chapter",
      addLessonSuccess: "Lesson added",
      addLessonErrorFallback: "Failed to add lesson",
      addLessonButton: "+ Add lesson",
      deleteLessonSuccess: "Lesson deleted",
      deleteLessonErrorFallback: "Failed to delete lesson",
    },
    createChapterModal: {
      title: "New chapter",
      nameLabel: "Chapter name",
      namePlaceholder: "e.g. Linear algebra...",
      nameRequired: "Please enter a chapter name",
      descriptionLabel: "Description",
      descriptionOptionalHint: "(optional)",
      descriptionPlaceholder: "Describe the chapter content...",
      cancelButton: "Cancel",
      submitButton: "Create chapter",
      toastSuccess: "Chapter created",
      toastErrorFallback: "Failed to create chapter",
    },
    deleteChapterToastSuccess: "Chapter deleted",
    deleteChapterToastErrorFallback: "Failed to delete chapter",
  },
};

export const curriculumDictionary: Record<Language, CurriculumDictionary> = {
  vi,
  en,
};
