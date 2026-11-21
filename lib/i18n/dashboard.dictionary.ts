import type { Language } from "@/types";

export type DashboardDictionary = {
  greeting: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  banner: {
    loading: string;
    hasSessionsPrefix: string;
    hasSessionsSuffixStudent: string;
    hasSessionsSuffixTutor: string;
    noSessionsStudent: string;
    noSessionsTutor: string;
  };
  overviewError: string;
  units: {
    millionsSuffix: string;
    sessionsShort: string;
  };
  stats: {
    classesLearning: string;
    classesTeaching: string;
    studentsCount: string;
    sessionsThisWeek: string;
    completedSuffix: string;
    unpaidTuition: string;
    overdueTuition: string;
    overdueNeedsPayment: string;
    overdueNone: string;
    revenueThisMonth: string;
  };
  schedule: {
    titleStudent: string;
    titleTutor: string;
    viewWeek: string;
    colTime: string;
    colClassSubject: string;
    colLocation: string;
    colFormat: string;
    loading: string;
    emptyToday: string;
    online: string;
    offline: string;
    onlineLocationFallback: string;
  };
  notifications: {
    title: string;
    viewAll: string;
    loading: string;
    empty: string;
    detail: string;
    types: {
      system: string;
      tuition: string;
      student: string;
      tutor: string;
    };
  };
  revenueChart: {
    titlePrefix: string;
    totalYearPrefix: string;
    sessionsSuffix: string;
    revenueLegend: string;
    sessionsLegend: string;
    tooltipRevenue: string;
    tooltipSessions: string;
    monthLabels: string[];
  };
  budgetOverview: {
    title: string;
  };
  budgetProgressItem: {
    spentSuffix: string;
    limitSuffix: string;
  };
  incomeExpenseChart: {
    title: string;
    income: string;
    expenses: string;
  };
  spendingCategory: {
    title: string;
    thisMonth: string;
    categories: {
      foodAndDining: string;
      housing: string;
      transport: string;
      shopping: string;
      entertainment: string;
      health: string;
      other: string;
    };
  };
  transactionsTable: {
    title: string;
    colTransaction: string;
    colCategory: string;
    colAccount: string;
    colType: string;
    colAmount: string;
    typeExpense: string;
    typeIncome: string;
    rows: {
      groceryStore: string;
      monthlySalary: string;
      netflix: string;
      freelanceWork: string;
      electricBill: string;
      categoryFoodAndDining: string;
      categoryIncome: string;
      categoryEntertainment: string;
      categoryHousing: string;
      accountMainCard: string;
      accountBank: string;
      accountCredit: string;
    };
  };
};

const vi: DashboardDictionary = {
  greeting: {
    morning: "Chào buổi sáng",
    afternoon: "Chào buổi chiều",
    evening: "Chào buổi tối",
  },
  banner: {
    loading: "Đang tải dữ liệu tổng quan…",
    hasSessionsPrefix: "Hôm nay bạn có",
    hasSessionsSuffixStudent: "buổi học.",
    hasSessionsSuffixTutor: "buổi dạy.",
    noSessionsStudent: "Hôm nay bạn không có buổi học nào.",
    noSessionsTutor: "Hôm nay bạn không có buổi dạy nào.",
  },
  overviewError: "Không tải được dữ liệu tổng quan. Vui lòng thử lại.",
  units: {
    millionsSuffix: "tr",
    sessionsShort: "bs",
  },
  stats: {
    classesLearning: "Lớp đang học",
    classesTeaching: "Lớp đang dạy",
    studentsCount: "Học sinh",
    sessionsThisWeek: "Buổi tuần này",
    completedSuffix: "đã hoàn thành",
    unpaidTuition: "Học phí chưa đóng",
    overdueTuition: "Khoản quá hạn",
    overdueNeedsPayment: "cần thanh toán",
    overdueNone: "không có",
    revenueThisMonth: "Doanh thu tháng này",
  },
  schedule: {
    titleStudent: "Lịch học hôm nay",
    titleTutor: "Lịch dạy hôm nay",
    viewWeek: "Xem lịch tuần",
    colTime: "Giờ",
    colClassSubject: "Lớp · Môn",
    colLocation: "Địa điểm",
    colFormat: "Hình thức",
    loading: "Đang tải…",
    emptyToday: "Chưa có buổi học nào hôm nay.",
    online: "Online",
    offline: "Trực tiếp",
    onlineLocationFallback: "Trực tuyến",
  },
  notifications: {
    title: "Thông báo gần đây",
    viewAll: "Xem tất cả",
    loading: "Đang tải…",
    empty: "Chưa có thông báo nào.",
    detail: "Chi tiết",
    types: {
      system: "Hệ thống",
      tuition: "Học phí",
      student: "Học sinh",
      tutor: "Gia sư",
    },
  },
  revenueChart: {
    titlePrefix: "Doanh thu theo tháng",
    totalYearPrefix: "Tổng năm:",
    sessionsSuffix: "buổi",
    revenueLegend: "Doanh thu",
    sessionsLegend: "Số buổi dạy",
    tooltipRevenue: "Doanh thu",
    tooltipSessions: "Số buổi",
    monthLabels: [
      "T1",
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
      "T7",
      "T8",
      "T9",
      "T10",
      "T11",
      "T12",
    ],
  },
  budgetOverview: {
    title: "Tổng quan ngân sách",
  },
  budgetProgressItem: {
    spentSuffix: "đã chi",
    limitSuffix: "hạn mức",
  },
  incomeExpenseChart: {
    title: "Thu nhập & Chi tiêu",
    income: "Thu nhập",
    expenses: "Chi tiêu",
  },
  spendingCategory: {
    title: "Chi tiêu theo danh mục",
    thisMonth: "Tháng này",
    categories: {
      foodAndDining: "Ăn uống",
      housing: "Nhà ở",
      transport: "Di chuyển",
      shopping: "Mua sắm",
      entertainment: "Giải trí",
      health: "Sức khỏe",
      other: "Khác",
    },
  },
  transactionsTable: {
    title: "Giao dịch",
    colTransaction: "Giao dịch",
    colCategory: "Danh mục",
    colAccount: "Tài khoản",
    colType: "Loại",
    colAmount: "Số tiền",
    typeExpense: "CHI",
    typeIncome: "THU",
    rows: {
      groceryStore: "Cửa hàng tạp hóa",
      monthlySalary: "Lương hàng tháng",
      netflix: "Netflix",
      freelanceWork: "Công việc tự do",
      electricBill: "Hóa đơn điện",
      categoryFoodAndDining: "Ăn uống",
      categoryIncome: "Thu nhập",
      categoryEntertainment: "Giải trí",
      categoryHousing: "Nhà ở",
      accountMainCard: "Thẻ chính",
      accountBank: "Ngân hàng",
      accountCredit: "Thẻ tín dụng",
    },
  },
};

const en: DashboardDictionary = {
  greeting: {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
  },
  banner: {
    loading: "Loading overview data…",
    hasSessionsPrefix: "You have",
    hasSessionsSuffixStudent: "class(es) today.",
    hasSessionsSuffixTutor: "teaching session(s) today.",
    noSessionsStudent: "You have no classes today.",
    noSessionsTutor: "You have no teaching sessions today.",
  },
  overviewError: "Failed to load overview data. Please try again.",
  units: {
    millionsSuffix: "M",
    sessionsShort: "ses",
  },
  stats: {
    classesLearning: "Enrolled classes",
    classesTeaching: "Classes teaching",
    studentsCount: "Students",
    sessionsThisWeek: "Sessions this week",
    completedSuffix: "completed",
    unpaidTuition: "Unpaid tuition",
    overdueTuition: "Overdue payments",
    overdueNeedsPayment: "payment needed",
    overdueNone: "none",
    revenueThisMonth: "Revenue this month",
  },
  schedule: {
    titleStudent: "Today's classes",
    titleTutor: "Today's teaching schedule",
    viewWeek: "View weekly schedule",
    colTime: "Time",
    colClassSubject: "Class · Subject",
    colLocation: "Location",
    colFormat: "Format",
    loading: "Loading…",
    emptyToday: "No sessions scheduled today.",
    online: "Online",
    offline: "In person",
    onlineLocationFallback: "Online",
  },
  notifications: {
    title: "Recent notifications",
    viewAll: "View all",
    loading: "Loading…",
    empty: "No notifications yet.",
    detail: "Details",
    types: {
      system: "System",
      tuition: "Tuition",
      student: "Student",
      tutor: "Tutor",
    },
  },
  revenueChart: {
    titlePrefix: "Revenue by month",
    totalYearPrefix: "Year total:",
    sessionsSuffix: "sessions",
    revenueLegend: "Revenue",
    sessionsLegend: "Sessions taught",
    tooltipRevenue: "Revenue",
    tooltipSessions: "Sessions",
    monthLabels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
  },
  budgetOverview: {
    title: "Budget Overview",
  },
  budgetProgressItem: {
    spentSuffix: "spent",
    limitSuffix: "limit",
  },
  incomeExpenseChart: {
    title: "Income vs Expenses",
    income: "Income",
    expenses: "Expenses",
  },
  spendingCategory: {
    title: "Spending by Category",
    thisMonth: "This Month",
    categories: {
      foodAndDining: "Food & Dining",
      housing: "Housing",
      transport: "Transport",
      shopping: "Shopping",
      entertainment: "Entertainment",
      health: "Health",
      other: "Other",
    },
  },
  transactionsTable: {
    title: "Transactions",
    colTransaction: "Transaction",
    colCategory: "Category",
    colAccount: "Account",
    colType: "Type",
    colAmount: "Amount",
    typeExpense: "EXPENSE",
    typeIncome: "INCOME",
    rows: {
      groceryStore: "Grocery Store",
      monthlySalary: "Monthly Salary",
      netflix: "Netflix",
      freelanceWork: "Freelance Work",
      electricBill: "Electric Bill",
      categoryFoodAndDining: "Food & Dining",
      categoryIncome: "Income",
      categoryEntertainment: "Entertainment",
      categoryHousing: "Housing",
      accountMainCard: "Main Card",
      accountBank: "Bank",
      accountCredit: "Credit",
    },
  },
};

export const dashboardDictionary: Record<Language, DashboardDictionary> = {
  vi,
  en,
};
