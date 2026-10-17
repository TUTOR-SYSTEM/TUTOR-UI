export type NotificationType = "SYSTEM" | "TUITION" | "STUDENT" | "TUTOR";

export type ApiNotificationField = { label: string; value: string };

export type ApiNotification = {
  id: string;
  type: NotificationType;
  title: string;
  content?: string | null;
  subContent?: string | null;
  isRead: boolean;
  redirectUrl?: string | null;
  actionLabel?: string | null;
  actionType?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type NotificationsApiPayload = {
  data: ApiNotification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/** `content` bắt buộc: cột DB `notifications.content` là NOT NULL. */
export type CreateNotificationPayload = {
  type: NotificationType;
  title: string;
  content: string;
  subContent?: string;
};

/** `PATCH /notifications/read-all` response. */
export type MarkAllReadResult = { markedAll: true; count: number };
