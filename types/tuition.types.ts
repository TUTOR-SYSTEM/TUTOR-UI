/** Học phí (tuition invoice) domain types — backed by `/tuitions` on the API. */

export type TuitionStatus = "PAID" | "UNPAID" | "OVERDUE";

export type TuitionClassInfo = {
  id: string;
  name: string;
  code: string;
};

export type TuitionStudentInfo = {
  id: string;
  firstName: string;
  lastName: string;
  userCode: string | null;
  phone: string | null;
  avatar: string | null;
};

export type TuitionRecord = {
  id: string;
  classId: string;
  studentId: string;
  amount: string;
  dueDate: string | null;
  paidDate: string | null;
  status: TuitionStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  class: TuitionClassInfo;
  student: TuitionStudentInfo;
};

export type TuitionsResponse = {
  tuitions: TuitionRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type TuitionSummary = {
  totalPaid: number;
  totalUnpaid: number;
  totalOverdue: number;
  totalRevenue: number;
};

export type CreateTuitionPayload = {
  classId: string;
  studentId: string;
  amount: number;
  dueDate?: string;
  status?: TuitionStatus;
  note?: string;
};

/** `null` xóa ngày (BE cho phép). */
export type UpdateTuitionPayload = {
  amount?: number;
  dueDate?: string | null;
  paidDate?: string | null;
  status?: TuitionStatus;
  note?: string;
};
