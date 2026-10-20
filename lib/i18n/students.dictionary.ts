import type { Language } from "@/types";

export type StudentsDictionary = {
  list: {
    heading: string;
    countSuffix: string;
    searchPlaceholder: string;
    addButton: string;
    tabs: {
      all: string;
    };
    tableHeaders: {
      stt: string;
      name: string;
      classCode: string;
      studentCode: string;
      studentPhone: string;
      parentName: string;
      parentPhone: string;
      actions: string;
    };
    emptyState: string;
    loadError: string;
    deleteSuccess: string;
    deleteError: string;
    filterPopup: {
      title: string;
      classLabel: string;
      classPlaceholder: string;
      genderLabel: string;
      genderPlaceholder: string;
      genderMale: string;
      genderFemale: string;
      genderOther: string;
      statusLabel: string;
      statusPlaceholder: string;
      statusActive: string;
      statusInactive: string;
      resetButton: string;
      applyButton: string;
    };
    guide: {
      title: string;
      step1Title: string;
      step1Prefix: string;
      step1Highlight: string;
      step1Suffix: string;
      step2Title: string;
      step2Body: string;
      step3Title: string;
      step3Body: string;
      step4Title: string;
      step4Body: string;
      noteLabel: string;
      noteBody: string;
    };
  };
  detail: {
    breadcrumbStudents: string;
    loadError: string;
    backToList: string;
    editProfile: string;
    messageParent: string;
    statAvgScore: string;
    statSubmitted: string;
    statGraded: string;
    tabs: {
      info: string;
      scores: string;
      sessions: string;
      files: string;
      progress: string;
    };
    genderLabels: {
      male: string;
      female: string;
      other: string;
    };
    studentInfoTitle: string;
    parentInfoTitle: string;
    infoLabels: {
      fullName: string;
      studentCode: string;
      gender: string;
      dob: string;
      school: string;
      phone: string;
      email: string;
      relationship: string;
      address: string;
    };
    classesEnrolledLabel: string;
    classCodeZero: string;
    scoresTable: {
      gradedDate: string;
      score: string;
      comment: string;
    };
    scoresEmpty: string;
    sessionsTable: {
      submittedDate: string;
      status: string;
      score: string;
    };
    sessionsEmpty: string;
    filesEmptyTitle: string;
    filesEmptyBody: string;
    progress: {
      avgScoreLabel: string;
      avgScoreSubPrefix: string;
      avgScoreSubSuffix: string;
      totalSubmittedLabel: string;
      gradedSuffix: string;
      pendingSuffix: string;
      classCountSub: string;
    };
  };
  parentPicker: {
    searching: string;
    noResults: string;
    matchedGroup: string;
    similarGroup: string;
  };
  addDialog: {
    title: string;
    subtitle: string;
    submitText: string;
    sectionStudentInfo: string;
    sectionParentInfo: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    studentCodeLabel: string;
    studentCodeGenerating: string;
    studentCodePlaceholder: string;
    genderLabel: string;
    genderMale: string;
    genderFemale: string;
    genderOther: string;
    classLabel: string;
    classPlaceholder: string;
    studentPhoneLabel: string;
    studentPhonePlaceholder: string;
    schoolLabel: string;
    schoolPlaceholder: string;
    parentNameLabel: string;
    parentNamePlaceholder: string;
    relationshipLabel: string;
    relationshipPlaceholder: string;
    parentPhoneLabel: string;
    parentPhonePlaceholder: string;
    parentEmailLabel: string;
    parentEmailPlaceholder: string;
    toastSuccess: string;
    toastError: string;
  };
  editDialog: {
    title: string;
    subtitle: string;
    submitText: string;
    sectionStudentInfo: string;
    sectionParentInfo: string;
    tutorLockedNote: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    classNameLabel: string;
    classNamePlaceholder: string;
    classNoneOption: string;
    genderLabel: string;
    genderMale: string;
    genderFemale: string;
    genderOther: string;
    birthdayLabel: string;
    studentPhoneLabel: string;
    studentPhonePlaceholder: string;
    schoolLabel: string;
    schoolPlaceholder: string;
    addressLabel: string;
    addressPlaceholder: string;
    districtLabel: string;
    districtPlaceholder: string;
    provinceLabel: string;
    provincePlaceholder: string;
    parentNameLabel: string;
    parentNamePlaceholder: string;
    relationshipLabel: string;
    relationshipPlaceholder: string;
    relationshipFather: string;
    relationshipMother: string;
    relationshipGuardian: string;
    parentPhoneLabel: string;
    parentPhonePlaceholder: string;
    parentEmailLabel: string;
    parentEmailPlaceholder: string;
    parentAddressLabel: string;
    parentAddressPlaceholder: string;
    parentDistrictLabel: string;
    parentDistrictPlaceholder: string;
    parentProvinceLabel: string;
    parentProvincePlaceholder: string;
    toastSuccess: string;
    toastErrorFallback: string;
    errStudentNameType: string;
    errStudentNameRequired: string;
    errNameMax255: string;
    errMax255: string;
    errMax20: string;
    errInvalidPhone: string;
  };
  deleteDialog: {
    descriptionPrefix: string;
    warningText: string;
  };
};

const vi: StudentsDictionary = {
  list: {
    heading: "Học sinh",
    countSuffix: " học sinh",
    searchPlaceholder: "Tìm theo tên, mã HS...",
    addButton: "Thêm học sinh",
    tabs: {
      all: "Tất cả lớp",
    },
    tableHeaders: {
      stt: "STT",
      name: "HỌ TÊN",
      classCode: "MÃ LỚP",
      studentCode: "MÃ HS",
      studentPhone: "SĐT HS",
      parentName: "TÊN PHỤ HUYNH",
      parentPhone: "SĐT PH",
      actions: "THAO TÁC",
    },
    emptyState: "Không tìm thấy học sinh phù hợp.",
    loadError: "Không thể tải danh sách học sinh.",
    deleteSuccess: "Xóa học sinh thành công!",
    deleteError: "Xóa thất bại",
    filterPopup: {
      title: "Bộ lọc",
      classLabel: "Lớp học",
      classPlaceholder: "Tất cả lớp",
      genderLabel: "Giới tính",
      genderPlaceholder: "Tất cả giới tính",
      genderMale: "Nam",
      genderFemale: "Nữ",
      genderOther: "Khác",
      statusLabel: "Trạng thái",
      statusPlaceholder: "Tất cả trạng thái",
      statusActive: "Đang hoạt động",
      statusInactive: "Ngừng hoạt động",
      resetButton: "Đặt lại bộ lọc",
      applyButton: "Áp dụng",
    },
    guide: {
      title: "Hướng dẫn sử dụng",
      step1Title: "Thêm học sinh mới",
      step1Prefix: "Nhấn nút",
      step1Highlight: "+ Thêm học sinh",
      step1Suffix: "ở góc trên, điền họ tên, mã lớp và thông tin phụ huynh.",
      step2Title: "Tìm kiếm & lọc",
      step2Body:
        "Gõ tên hoặc mã HS vào ô tìm kiếm, hoặc chọn lớp ở thanh lọc để thu hẹp danh sách.",
      step3Title: "Xem hồ sơ chi tiết",
      step3Body:
        "Nhấn vào tên học sinh để mở hồ sơ với 5 tab: thông tin, điểm số, lịch sử buổi học, file bài tập, tiến bộ.",
      step4Title: "Sửa hoặc xóa",
      step4Body:
        "Dùng biểu tượng bút để chỉnh sửa thông tin, biểu tượng thùng rác để xóa học sinh khỏi danh sách.",
      noteLabel: "Lưu ý:",
      noteBody:
        "Mỗi học sinh có một mã HS duy nhất. Khi xóa học sinh, toàn bộ điểm số và lịch sử buổi học liên quan cũng sẽ bị gỡ — hãy cân nhắc trước khi thực hiện.",
    },
  },
  detail: {
    breadcrumbStudents: "Học sinh",
    loadError: "Không thể tải hồ sơ học sinh",
    backToList: "Quay lại danh sách học sinh",
    editProfile: "Sửa hồ sơ",
    messageParent: "Nhắn phụ huynh",
    statAvgScore: "Điểm TB bài tập",
    statSubmitted: "Bài đã nộp",
    statGraded: "Đã chấm điểm",
    tabs: {
      info: "Thông tin cá nhân",
      scores: "Điểm số & nhận xét",
      sessions: "Lịch sử bài tập",
      files: "File bài tập",
      progress: "Mức độ tiến bộ",
    },
    genderLabels: {
      male: "Nam",
      female: "Nữ",
      other: "Khác",
    },
    studentInfoTitle: "Thông tin học sinh",
    parentInfoTitle: "Phụ huynh",
    infoLabels: {
      fullName: "Họ và tên",
      studentCode: "Mã học sinh",
      gender: "Giới tính",
      dob: "Ngày sinh",
      school: "Trường",
      phone: "Số điện thoại",
      email: "Email",
      relationship: "Quan hệ",
      address: "Địa chỉ",
    },
    classesEnrolledLabel: "Số lớp đang học",
    classCodeZero: "Chưa có lớp",
    scoresTable: {
      gradedDate: "Ngày chấm",
      score: "Điểm",
      comment: "Nhận xét",
    },
    scoresEmpty: "Chưa có bài tập nào được chấm điểm.",
    sessionsTable: {
      submittedDate: "Ngày nộp",
      status: "Trạng thái",
      score: "Điểm",
    },
    sessionsEmpty: "Học sinh chưa nộp bài tập nào.",
    filesEmptyTitle: "Chưa có file bài tập",
    filesEmptyBody: "Học sinh chưa nộp tệp bài làm nào.",
    progress: {
      avgScoreLabel: "Điểm trung bình bài tập",
      avgScoreSubPrefix: "Dựa trên ",
      avgScoreSubSuffix: " bài đã chấm",
      totalSubmittedLabel: "Tổng bài đã nộp",
      gradedSuffix: " đã chấm",
      pendingSuffix: " chờ/khác",
      classCountSub: "Tổng số lớp học sinh đang tham gia",
    },
  },
  parentPicker: {
    searching: "Đang tìm...",
    noResults: "Không tìm thấy phụ huynh. Nhập thông tin bên dưới để tạo phụ huynh mới.",
    matchedGroup: "Phụ huynh trùng tên",
    similarGroup: "Phụ huynh gần giống",
  },
  addDialog: {
    title: "Thêm học sinh mới",
    subtitle: "Điền thông tin học sinh và phụ huynh để tạo hồ sơ.",
    submitText: "Lưu học sinh",
    sectionStudentInfo: "Thông tin học sinh",
    sectionParentInfo: "Thông tin phụ huynh",
    fullNameLabel: "Họ và tên",
    fullNamePlaceholder: "VD: Trần Văn Khoa",
    studentCodeLabel: "Mã học sinh",
    studentCodeGenerating: "Đang tạo mã...",
    studentCodePlaceholder: "Mã tự động tạo",
    genderLabel: "Giới tính",
    genderMale: "Nam",
    genderFemale: "Nữ",
    genderOther: "Khác",
    classLabel: "Lớp học",
    classPlaceholder: "Chọn lớp học...",
    studentPhoneLabel: "SĐT học sinh",
    studentPhonePlaceholder: "VD: 0901 234 567",
    schoolLabel: "Trường",
    schoolPlaceholder: "VD: THPT Quang Trung",
    parentNameLabel: "Họ và tên phụ huynh",
    parentNamePlaceholder: "VD: Trần Văn Hùng",
    relationshipLabel: "Quan hệ",
    relationshipPlaceholder: "Bố / Mẹ...",
    parentPhoneLabel: "SĐT phụ huynh",
    parentPhonePlaceholder: "VD: 0912 345 678",
    parentEmailLabel: "Email phụ huynh",
    parentEmailPlaceholder: "VD: phuhuynh@gmail.com",
    toastSuccess: "Thêm học sinh thành công!",
    toastError: "Thêm học sinh thất bại",
  },
  editDialog: {
    title: "Chỉnh sửa học sinh",
    subtitle: "Cập nhật thông tin học sinh và phụ huynh.",
    submitText: "Lưu thay đổi",
    sectionStudentInfo: "Thông tin học sinh",
    sectionParentInfo: "Thông tin phụ huynh",
    tutorLockedNote:
      "Gia sư không thể chỉnh sửa mục này — liên hệ quản trị viên nếu cần cập nhật.",
    fullNameLabel: "Họ và tên",
    fullNamePlaceholder: "VD: Trần Văn Khoa",
    classNameLabel: "Lớp học",
    classNamePlaceholder: "Chọn lớp học...",
    classNoneOption: "— Không có lớp —",
    genderLabel: "Giới tính",
    genderMale: "Nam",
    genderFemale: "Nữ",
    genderOther: "Khác",
    birthdayLabel: "Ngày sinh",
    studentPhoneLabel: "SĐT học sinh",
    studentPhonePlaceholder: "VD: 0901 234 567",
    schoolLabel: "Trường",
    schoolPlaceholder: "VD: THPT Quang Trung",
    addressLabel: "Địa chỉ",
    addressPlaceholder: "VD: 123 Nguyễn Trãi",
    districtLabel: "Quận/Huyện",
    districtPlaceholder: "VD: Thanh Xuân",
    provinceLabel: "Tỉnh/Thành phố",
    provincePlaceholder: "VD: Hà Nội",
    parentNameLabel: "Họ và tên phụ huynh",
    parentNamePlaceholder: "VD: Trần Văn Hùng",
    relationshipLabel: "Quan hệ",
    relationshipPlaceholder: "Bố / Mẹ...",
    relationshipFather: "Bố",
    relationshipMother: "Mẹ",
    relationshipGuardian: "Người giám hộ",
    parentPhoneLabel: "SĐT phụ huynh",
    parentPhonePlaceholder: "VD: 0912 345 678",
    parentEmailLabel: "Email phụ huynh",
    parentEmailPlaceholder: "VD: phuhuynh@gmail.com",
    parentAddressLabel: "Địa chỉ phụ huynh",
    parentAddressPlaceholder: "VD: 123 Nguyễn Trãi",
    parentDistrictLabel: "Quận/Huyện phụ huynh",
    parentDistrictPlaceholder: "VD: Thanh Xuân",
    parentProvinceLabel: "Tỉnh/Thành phố phụ huynh",
    parentProvincePlaceholder: "VD: Hà Nội",
    toastSuccess: "Cập nhật học sinh thành công!",
    toastErrorFallback: "Cập nhật thất bại",
    errStudentNameType: "Họ tên phải là chuỗi ký tự",
    errStudentNameRequired: "Vui lòng nhập họ tên",
    errNameMax255: "Tên không quá 255 ký tự",
    errMax255: "Tối đa 255 ký tự",
    errMax20: "Tối đa 20 ký tự",
    errInvalidPhone: "Số điện thoại không hợp lệ",
  },
  deleteDialog: {
    descriptionPrefix: "Bạn có chắc muốn xóa học sinh",
    warningText:
      "Toàn bộ điểm số và lịch sử buổi học liên quan cũng sẽ bị gỡ. Hành động này không thể hoàn tác.",
  },
};

const en: StudentsDictionary = {
  list: {
    heading: "Students",
    countSuffix: " students",
    searchPlaceholder: "Search by name or student code...",
    addButton: "Add student",
    tabs: {
      all: "All classes",
    },
    tableHeaders: {
      stt: "NO.",
      name: "FULL NAME",
      classCode: "CLASS CODE",
      studentCode: "STUDENT CODE",
      studentPhone: "STUDENT PHONE",
      parentName: "PARENT NAME",
      parentPhone: "PARENT PHONE",
      actions: "ACTIONS",
    },
    emptyState: "No matching students found.",
    loadError: "Unable to load the student list.",
    deleteSuccess: "Student deleted successfully!",
    deleteError: "Delete failed",
    filterPopup: {
      title: "Filters",
      classLabel: "Class",
      classPlaceholder: "All classes",
      genderLabel: "Gender",
      genderPlaceholder: "All genders",
      genderMale: "Male",
      genderFemale: "Female",
      genderOther: "Other",
      statusLabel: "Status",
      statusPlaceholder: "All statuses",
      statusActive: "Active",
      statusInactive: "Inactive",
      resetButton: "Reset filters",
      applyButton: "Apply",
    },
    guide: {
      title: "Usage guide",
      step1Title: "Add a new student",
      step1Prefix: "Click the",
      step1Highlight: "+ Add student",
      step1Suffix:
        "button at the top, then fill in the name, class code and parent information.",
      step2Title: "Search & filter",
      step2Body:
        "Type a name or student code into the search box, or pick a class in the filter bar to narrow the list.",
      step3Title: "View detailed profile",
      step3Body:
        "Click a student's name to open their profile with 5 tabs: info, scores, session history, assignment files, progress.",
      step4Title: "Edit or delete",
      step4Body:
        "Use the pencil icon to edit information, and the trash icon to remove a student from the list.",
      noteLabel: "Note:",
      noteBody:
        "Each student has a unique student code. Deleting a student also removes all related scores and session history — please consider carefully before proceeding.",
    },
  },
  detail: {
    breadcrumbStudents: "Students",
    loadError: "Unable to load the student profile",
    backToList: "Back to student list",
    editProfile: "Edit profile",
    messageParent: "Message parent",
    statAvgScore: "Avg. assignment score",
    statSubmitted: "Assignments submitted",
    statGraded: "Graded",
    tabs: {
      info: "Personal info",
      scores: "Scores & feedback",
      sessions: "Assignment history",
      files: "Assignment files",
      progress: "Progress",
    },
    genderLabels: {
      male: "Male",
      female: "Female",
      other: "Other",
    },
    studentInfoTitle: "Student information",
    parentInfoTitle: "Parent",
    infoLabels: {
      fullName: "Full name",
      studentCode: "Student code",
      gender: "Gender",
      dob: "Date of birth",
      school: "School",
      phone: "Phone number",
      email: "Email",
      relationship: "Relationship",
      address: "Address",
    },
    classesEnrolledLabel: "Classes enrolled",
    classCodeZero: "No class yet",
    scoresTable: {
      gradedDate: "Graded date",
      score: "Score",
      comment: "Comment",
    },
    scoresEmpty: "No assignments have been graded yet.",
    sessionsTable: {
      submittedDate: "Submitted date",
      status: "Status",
      score: "Score",
    },
    sessionsEmpty: "The student hasn't submitted any assignments yet.",
    filesEmptyTitle: "No assignment files yet",
    filesEmptyBody: "The student hasn't uploaded any files yet.",
    progress: {
      avgScoreLabel: "Average assignment score",
      avgScoreSubPrefix: "Based on ",
      avgScoreSubSuffix: " graded assignments",
      totalSubmittedLabel: "Total submitted",
      gradedSuffix: " graded",
      pendingSuffix: " pending/other",
      classCountSub: "Total number of classes the student is enrolled in",
    },
  },
  parentPicker: {
    searching: "Searching...",
    noResults: "No parent found. Enter the details below to create a new parent.",
    matchedGroup: "Name matches",
    similarGroup: "Similar names",
  },
  addDialog: {
    title: "Add new student",
    subtitle: "Fill in the student and parent information to create a profile.",
    submitText: "Save student",
    sectionStudentInfo: "Student information",
    sectionParentInfo: "Parent information",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "e.g. John Smith",
    studentCodeLabel: "Student code",
    studentCodeGenerating: "Generating code...",
    studentCodePlaceholder: "Auto-generated code",
    genderLabel: "Gender",
    genderMale: "Male",
    genderFemale: "Female",
    genderOther: "Other",
    classLabel: "Class",
    classPlaceholder: "Select a class...",
    studentPhoneLabel: "Student phone",
    studentPhonePlaceholder: "e.g. 0901 234 567",
    schoolLabel: "School",
    schoolPlaceholder: "e.g. Quang Trung High School",
    parentNameLabel: "Parent full name",
    parentNamePlaceholder: "e.g. Robert Smith",
    relationshipLabel: "Relationship",
    relationshipPlaceholder: "Father / Mother...",
    parentPhoneLabel: "Parent phone",
    parentPhonePlaceholder: "e.g. 0912 345 678",
    parentEmailLabel: "Parent email",
    parentEmailPlaceholder: "e.g. parent@gmail.com",
    toastSuccess: "Student added successfully!",
    toastError: "Failed to add student",
  },
  editDialog: {
    title: "Edit student",
    subtitle: "Update the student and parent information.",
    submitText: "Save changes",
    sectionStudentInfo: "Student information",
    sectionParentInfo: "Parent information",
    tutorLockedNote:
      "Tutors cannot edit this section — contact an admin if it needs to change.",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "e.g. John Smith",
    classNameLabel: "Class",
    classNamePlaceholder: "Select a class...",
    classNoneOption: "— No class —",
    genderLabel: "Gender",
    genderMale: "Male",
    genderFemale: "Female",
    genderOther: "Other",
    birthdayLabel: "Date of birth",
    studentPhoneLabel: "Student phone",
    studentPhonePlaceholder: "e.g. 0901 234 567",
    schoolLabel: "School",
    schoolPlaceholder: "e.g. Quang Trung High School",
    addressLabel: "Address",
    addressPlaceholder: "e.g. 123 Nguyen Trai",
    districtLabel: "District",
    districtPlaceholder: "e.g. Thanh Xuan",
    provinceLabel: "Province/City",
    provincePlaceholder: "e.g. Hanoi",
    parentNameLabel: "Parent full name",
    parentNamePlaceholder: "e.g. Robert Smith",
    relationshipLabel: "Relationship",
    relationshipPlaceholder: "Father / Mother...",
    relationshipFather: "Father",
    relationshipMother: "Mother",
    relationshipGuardian: "Guardian",
    parentPhoneLabel: "Parent phone",
    parentPhonePlaceholder: "e.g. 0912 345 678",
    parentEmailLabel: "Parent email",
    parentEmailPlaceholder: "e.g. parent@gmail.com",
    parentAddressLabel: "Parent address",
    parentAddressPlaceholder: "e.g. 123 Nguyen Trai",
    parentDistrictLabel: "Parent district",
    parentDistrictPlaceholder: "e.g. Thanh Xuan",
    parentProvinceLabel: "Parent province/city",
    parentProvincePlaceholder: "e.g. Hanoi",
    toastSuccess: "Student updated successfully!",
    toastErrorFallback: "Update failed",
    errStudentNameType: "Full name must be a string",
    errStudentNameRequired: "Please enter the full name",
    errNameMax255: "Name must not exceed 255 characters",
    errMax255: "Maximum 255 characters",
    errMax20: "Maximum 20 characters",
    errInvalidPhone: "Invalid phone number",
  },
  deleteDialog: {
    descriptionPrefix: "Are you sure you want to delete student",
    warningText:
      "All related scores and session history will also be removed. This action cannot be undone.",
  },
};

export const studentsDictionary: Record<Language, StudentsDictionary> = {
  vi,
  en,
};
