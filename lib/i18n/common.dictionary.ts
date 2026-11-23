import type { Language } from "@/types";

export type CommonDictionary = {
  actions: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    create: string;
    search: string;
    searchPlaceholder: string;
    confirm: string;
    close: string;
    back: string;
    loading: string;
    processing: string;
    submit: string;
    filter: string;
    view: string;
    viewDetail: string;
    retry: string;
    export: string;
    upload: string;
    download: string;
    all: string;
  };
  table: {
    loadError: string;
    noData: string;
  };
  pagination: {
    previous: string;
    next: string;
    rowsPerPage: string;
  };
  confirmDialog: {
    deleteTitle: string;
    confirm: string;
    cancel: string;
    /** "Bạn có chắc muốn xóa" + " {label} {name}" + "?" */
    questionPrefix: string;
    questionSuffix: string;
    irreversible: string;
  };
  statusConfirm: {
    closeClassTitle: string;
    closeClassDescription: string;
    confirm: string;
  };
  datePicker: {
    placeholder: string;
    today: string;
    clear: string;
    prevMonth: string;
    nextMonth: string;
  };
  timePicker: {
    placeholder: string;
    clear: string;
    done: string;
  };
};

const vi: CommonDictionary = {
  actions: {
    save: "Lưu",
    cancel: "Hủy",
    delete: "Xóa",
    edit: "Chỉnh sửa",
    add: "Thêm",
    create: "Tạo mới",
    search: "Tìm kiếm",
    searchPlaceholder: "Tìm kiếm...",
    confirm: "Xác nhận",
    close: "Đóng",
    back: "Quay lại",
    loading: "Đang tải…",
    processing: "Đang xử lý…",
    submit: "Gửi",
    filter: "Bộ lọc",
    view: "Xem",
    viewDetail: "Xem chi tiết",
    retry: "Thử lại",
    export: "Xuất file",
    upload: "Tải lên",
    download: "Tải xuống",
    all: "Tất cả",
  },
  table: {
    loadError: "Không thể tải dữ liệu.",
    noData: "Không có dữ liệu.",
  },
  pagination: {
    previous: "Trước",
    next: "Sau",
    rowsPerPage: "Số dòng/trang:",
  },
  confirmDialog: {
    deleteTitle: "Xác nhận xóa",
    confirm: "Xóa",
    cancel: "Hủy",
    questionPrefix: "Bạn có chắc muốn xóa",
    questionSuffix: "?",
    irreversible: "Hành động này không thể hoàn tác.",
  },
  statusConfirm: {
    closeClassTitle: "Đóng lớp học?",
    closeClassDescription: "Lớp sẽ chuyển sang trạng thái Đã đóng.",
    confirm: "Xác nhận",
  },
  datePicker: {
    placeholder: "Chọn ngày",
    today: "Hôm nay",
    clear: "Xóa",
    prevMonth: "Tháng trước",
    nextMonth: "Tháng sau",
  },
  timePicker: {
    placeholder: "Chọn giờ",
    clear: "Xóa",
    done: "Xong",
  },
};

const en: CommonDictionary = {
  actions: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    create: "Create",
    search: "Search",
    searchPlaceholder: "Search...",
    confirm: "Confirm",
    close: "Close",
    back: "Back",
    loading: "Loading…",
    processing: "Processing…",
    submit: "Submit",
    filter: "Filter",
    view: "View",
    viewDetail: "View details",
    retry: "Retry",
    export: "Export",
    upload: "Upload",
    download: "Download",
    all: "All",
  },
  table: {
    loadError: "Unable to load data.",
    noData: "No data.",
  },
  pagination: {
    previous: "Previous",
    next: "Next",
    rowsPerPage: "Rows per page:",
  },
  confirmDialog: {
    deleteTitle: "Confirm delete",
    confirm: "Delete",
    cancel: "Cancel",
    questionPrefix: "Are you sure you want to delete",
    questionSuffix: "?",
    irreversible: "This action cannot be undone.",
  },
  statusConfirm: {
    closeClassTitle: "Close this class?",
    closeClassDescription: "The class will be moved to the Closed status.",
    confirm: "Confirm",
  },
  datePicker: {
    placeholder: "Pick a date",
    today: "Today",
    clear: "Clear",
    prevMonth: "Previous month",
    nextMonth: "Next month",
  },
  timePicker: {
    placeholder: "Pick a time",
    clear: "Clear",
    done: "Done",
  },
};

export const commonDictionary: Record<Language, CommonDictionary> = { vi, en };
