/** Cài đặt giảng dạy của gia sư — khớp `GET/PUT /settings/teaching`. */
export type TeachingSettings = {
  sessionDurationMinutes: number;
  defaultFee: number;
  timezone: string;
  workHoursStart: string;
  workHoursEnd: string;
  remindStudents: boolean;
  allowOnlineBooking: boolean;
  autoInvoiceMonthly: boolean;
  breakBetweenSessions: boolean;
};

/** Tài khoản nhận học phí + công tắc thanh toán — khớp `GET/PUT /settings/payment`. */
export type PaymentSettings = {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branch: string;
  autoPaymentReminder: boolean;
  electronicReceipt: boolean;
};
