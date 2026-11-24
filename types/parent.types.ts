import type { SessionFile } from "./session.types";

/** Con của phụ huynh đang đăng nhập — `GET /students/my-children`. */
export type ParentChild = {
  id: string;
  firstName: string;
  lastName: string;
  userCode: string | null;
  tutorId: string | null;
};

/** Một dòng bài tập trong `GET /exercises` (BE đã enrich session/class/student). */
export type ParentExerciseRow = {
  id: string;
  status: "ASSIGNED" | "SUBMITTED" | "GRADED" | "RESUBMIT";
  score: number | null;
  exerciseUrls: SessionFile[] | null;
  session: { id: string; sessionNumber: number; classId: string } | null;
  class: { id: string; name: string; code: string } | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    userCode: string | null;
    avatar: string | null;
  } | null;
};

export type ParentExercisesPayload = {
  data: ParentExerciseRow[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/** Tài khoản phụ huynh do admin quản lý — `GET /admin/parents`. */
export type ApiParent = {
  id: string;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt?: string;
};

export type AdminParentsPayload = {
  parents: ApiParent[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/** PUT /admin/parents/:id/password — id nằm trong URL. */
export type ParentPasswordPayload = { id: string; password: string };
