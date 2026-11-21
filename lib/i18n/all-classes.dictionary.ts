import type { Language } from "@/types";

export type AllClassesDictionary = {
  title: string;
  countSuffix: (count: number) => string;
  searchPlaceholder: string;
  tutorFilterAll: string;
  tutorFilterPlaceholder: string;
  statusFilterAll: string;
  filterPopup: {
    title: string;
    tutorLabel: string;
    statusLabel: string;
    resetButton: string;
    applyButton: string;
  };
  columns: {
    index: string;
    name: string;
    code: string;
    subject: string;
    tutor: string;
    students: string;
    status: string;
    actions: string;
  };
  rowActions: {
    edit: string;
    changeStatus: string;
    delete: string;
    statusSuccess: string;
    statusError: string;
  };
  status: { OPEN: string; CLOSED: string; UPCOMING: string };
  unknownTutor: string;
  empty: string;
  loadError: string;
  addButton: string;
  addDialog: {
    title: string;
    subtitle: string;
    submit: string;
    tutorLabel: string;
    tutorPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    tuitionLabel: string;
    startLabel: string;
    endLabel: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    errTutor: string;
    errName: string;
    errSubject: string;
    errStart: string;
    errEnd: string;
    errEndBeforeStart: string;
    toastSuccess: string;
    toastError: string;
  };
  guide: {
    title: string;
    steps: { n: number; title: string; body: string }[];
  };
};

export const allClassesDictionary: Record<Language, AllClassesDictionary> = {
  vi: {
    title: "Tất cả lớp học",
    countSuffix: (count) => `${count} lớp`,
    searchPlaceholder: "Tìm theo tên, mã lớp, môn học...",
    tutorFilterAll: "Tất cả gia sư",
    tutorFilterPlaceholder: "Lọc theo gia sư",
    statusFilterAll: "Mọi trạng thái",
    filterPopup: {
      title: "Bộ lọc",
      tutorLabel: "Gia sư quản lý",
      statusLabel: "Trạng thái",
      resetButton: "Đặt lại bộ lọc",
      applyButton: "Áp dụng",
    },
    columns: {
      index: "#",
      name: "Tên lớp",
      code: "Mã lớp",
      subject: "Môn học",
      tutor: "Gia sư quản lý",
      students: "Học sinh",
      status: "Trạng thái",
      actions: "Thao tác",
    },
    rowActions: {
      edit: "Chỉnh sửa",
      changeStatus: "Đổi trạng thái",
      delete: "Xóa lớp",
      statusSuccess: "Đã cập nhật trạng thái lớp học",
      statusError: "Cập nhật trạng thái thất bại",
    },
    status: { OPEN: "Đang mở", CLOSED: "Đã đóng", UPCOMING: "Sắp mở" },
    unknownTutor: "—",
    empty: "Chưa có lớp học nào",
    loadError: "Không tải được danh sách lớp học",
    addButton: "Thêm lớp học",
    addDialog: {
      title: "Thêm lớp học",
      subtitle: "Tạo lớp mới và gán gia sư quản lý.",
      submit: "Tạo lớp",
      tutorLabel: "Gia sư quản lý",
      tutorPlaceholder: "Chọn gia sư...",
      nameLabel: "Tên lớp",
      namePlaceholder: "VD: Toán 9 - Nâng cao",
      subjectLabel: "Môn học",
      subjectPlaceholder: "Chọn môn học...",
      tuitionLabel: "Học phí / buổi (VNĐ)",
      startLabel: "Ngày bắt đầu",
      endLabel: "Ngày kết thúc",
      descriptionLabel: "Mô tả",
      descriptionPlaceholder: "Ghi chú về lớp học (không bắt buộc)",
      errTutor: "Vui lòng chọn gia sư",
      errName: "Vui lòng nhập tên lớp",
      errSubject: "Vui lòng chọn môn học",
      errStart: "Chọn ngày bắt đầu",
      errEnd: "Chọn ngày kết thúc",
      errEndBeforeStart: "Ngày kết thúc phải sau ngày bắt đầu",
      toastSuccess: "Đã tạo lớp học",
      toastError: "Tạo lớp học thất bại",
    },
    guide: {
      title: "Hướng dẫn sử dụng",
      steps: [
        { n: 1, title: "Tìm lớp", body: "Gõ tên, mã lớp hoặc môn học vào ô tìm kiếm để lọc danh sách." },
        { n: 2, title: "Lọc theo gia sư", body: "Chọn một gia sư để chỉ xem các lớp gia sư đó đang quản lý." },
        { n: 3, title: "Lọc theo trạng thái", body: "Chọn Đang mở, Đã đóng hoặc Sắp mở để thu hẹp danh sách." },
        { n: 4, title: "Chuyển trang", body: "Dùng phân trang ở cuối bảng khi có nhiều lớp học." },
      ],
    },
  },
  en: {
    title: "All classes",
    countSuffix: (count) => `${count} classes`,
    searchPlaceholder: "Search by name, code, subject...",
    tutorFilterAll: "All tutors",
    tutorFilterPlaceholder: "Filter by tutor",
    statusFilterAll: "Any status",
    filterPopup: {
      title: "Filters",
      tutorLabel: "Managing tutor",
      statusLabel: "Status",
      resetButton: "Reset filters",
      applyButton: "Apply",
    },
    columns: {
      index: "#",
      name: "Class",
      code: "Code",
      subject: "Subject",
      tutor: "Managing tutor",
      students: "Students",
      status: "Status",
      actions: "Actions",
    },
    rowActions: {
      edit: "Edit",
      changeStatus: "Change status",
      delete: "Delete class",
      statusSuccess: "Class status updated",
      statusError: "Couldn't update the status",
    },
    status: { OPEN: "Open", CLOSED: "Closed", UPCOMING: "Upcoming" },
    unknownTutor: "—",
    empty: "No classes yet",
    loadError: "Couldn't load the class list",
    addButton: "Add class",
    addDialog: {
      title: "Add class",
      subtitle: "Create a class and assign its managing tutor.",
      submit: "Create class",
      tutorLabel: "Managing tutor",
      tutorPlaceholder: "Select a tutor...",
      nameLabel: "Class name",
      namePlaceholder: "e.g. Math 9 - Advanced",
      subjectLabel: "Subject",
      subjectPlaceholder: "Select a subject...",
      tuitionLabel: "Fee per session (VND)",
      startLabel: "Start date",
      endLabel: "End date",
      descriptionLabel: "Description",
      descriptionPlaceholder: "Notes about the class (optional)",
      errTutor: "Please select a tutor",
      errName: "Please enter the class name",
      errSubject: "Please select a subject",
      errStart: "Select a start date",
      errEnd: "Select an end date",
      errEndBeforeStart: "End date must be after the start date",
      toastSuccess: "Class created",
      toastError: "Couldn't create the class",
    },
    guide: {
      title: "User guide",
      steps: [
        { n: 1, title: "Find a class", body: "Type a name, code or subject in the search box to filter the list." },
        { n: 2, title: "Filter by tutor", body: "Pick a tutor to see only the classes they manage." },
        { n: 3, title: "Filter by status", body: "Choose Open, Closed or Upcoming to narrow the list." },
        { n: 4, title: "Change page", body: "Use the pagination below the table when there are many classes." },
      ],
    },
  },
};
