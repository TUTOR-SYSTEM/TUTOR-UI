export type NewStudent = {
  name: string;
  userCode: string;
  classCode: string;
  studentPhone: string;
  school: string;
  parentName: string;
  parentEmail: string;
  parentRelationship: string;
  parentPhone: string;
};

/* ─── props ─── */
export type StudentProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (student: NewStudent) => void;
};

/* ─── UI constants ─── */
/** Values must match gateway `createStudentSchema` / `updateStudentSchema` (`parentRelationship`). */
export const RELATIONSHIP_OPTIONS = [
  { label: "Bố", value: "FATHER" },
  { label: "Mẹ", value: "MOTHER" },
  { label: "Người giám hộ", value: "GUARDIAN" },
];

export enum GENDER_ENUM {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export const GENDER = [
  { value: "MALE", field: "MALE" },
  { value: "FEMALE", field: "FEMALE" },
  { value: "OTHER", field: "OTHER" },
] as const;

export type FormValuesStudent = {
  studentName: string;
  userCode: string;
  classCode: string;
  gender: GENDER_ENUM;
  studentPhone: string;
  school: string;
  /** Họ phụ huynh (bắt buộc ở form tạo; ghép với `parentFirstName` thành `parentName` khi gửi). */
  parentLastName: string;
  /** Tên phụ huynh (bắt buộc ở form tạo). */
  parentFirstName: string;
  /** Email học sinh (bắt buộc khi tạo). */
  email: string;
  /** SĐT phụ huynh MỚI — bắt buộc nhập SĐT hoặc email nếu không liên kết phụ huynh có sẵn. */
  parentPhone: string;
  /** Email phụ huynh MỚI. */
  parentEmail: string;
  /** Mật khẩu đăng nhập cho học sinh (trống = BE sinh ngẫu nhiên). */
  password?: string;
  /** Mật khẩu cho phụ huynh MỚI (bỏ qua khi liên kết phụ huynh có sẵn). */
  parentPassword?: string;
  /** Gia sư quản lý (chỉ ADMIN chọn; TUTOR để trống, server gán chính tutor). */
  tutorId?: string;
};

/** Matches POST /students (`createStudentSchema` on the backend). */
export type CreateStudentPayload = {
  tutorId?: string;
  studentName: string;
  /** Bắt buộc: email học sinh. */
  email: string;
  userCode?: string;
  classCode?: string;
  gender: GENDER_ENUM;
  studentPhone?: string;
  school?: string;
  /** Optional: BE generates a random password when omitted. */
  password?: string;
  /** Link an existing PARENT user instead of creating one from `parentName`/`parentPhone`/... */
  parentId?: string;
  parentName?: string;
  parentRelationship?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentPassword?: string;
};

/** PUT /students/:id/password — id goes in the URL, body carries only the password. */
export type SetStudentPasswordPayload = { id: string; password: string };

/** Existing PARENT user picked from search and linked to a student (not created from the form). */
export type ParentOption = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
};

export type Student = {
  id: string;
  /** Managing tutor id — null when unassigned. */
  tutorId: string | null;
  /** Linked PARENT user id — null when the student has no parent account. */
  parentId: string | null;
  /** Tên gia sư quản lý (hiển thị ở danh sách) — rỗng khi chưa gán. */
  tutorName?: string;
  initials: string;
  avatarColor: string;
  name: string;
  /** Tên (BE `firstName`) — phần sau họ với tên Việt. */
  firstName: string;
  /** Họ (BE `lastName`). */
  lastName: string;
  subject: string;
  /** Current class id (enrolled via class_students) — null if not enrolled in any class. */
  classId: string | null;
  /** Mọi lớp học sinh đang học (dùng cho action "Xoá khỏi lớp"). */
  classes: { id: string; name: string; code: string }[];
  classCode: string;
  studentId: string;
  phone: string;
  gender: string | null;
  dateOfBirth: string | null;
  school: string | null;
  address: string | null;
  district: string | null;
  province: string | null;
  parentName: string;
  parentFirstName: string;
  parentLastName: string;
  parentPhone: string;
  parentEmail: string | null;
  parentRelationship: string | null;
  parentAddress: string | null;
  parentDistrict: string | null;
  parentProvince: string | null;
};

/** Nested parent user object embedded in GET /students, /students/:id. */
export type ApiStudentParent = {
  id: string;
  email?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatar?: string | null;
  isActive?: boolean;
  role?: string;
  userCode?: string | null;
  relationship?: string | null;
  address?: string | null;
  district?: string | null;
  province?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiStudent = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string;
  userCode?: string | null;
  phone?: string | null;
  email?: string | null;
  avatar?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  dateOfBirth?: string | null;
  school?: string | null;
  address?: string | null;
  district?: string | null;
  province?: string | null;
  role?: string;
  isActive?: boolean;
  classId?: string | null;
  gradesId?: string[];
  parentId?: string | null;
  tutorId?: string | null;
  /** Gia sư quản lý (tóm tắt) — null khi chưa gán. */
  tutor?: {
    id: string;
    firstName: string;
    lastName: string;
    userCode: string | null;
    email: string;
    phone: string | null;
    avatar: string | null;
  } | null;
  /** Parent contact info — nested object, not flat parentName/parentPhone/... fields. */
  parent?: ApiStudentParent | null;
  /** Enrolled class(es) — joined from class_students, not the (unused) legacy `classId` column above. */
  classes?: { id: string; name: string; code: string }[];
  classCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

/** GET /students/parents — PARENT accounts a student can be linked to (siblings share one). */
export type ParentsApiPayload = {
  parents: import("./user.types").ApiManagedUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type StudentsApiPayload = {
  students: ApiStudent[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type UpdateStudentPayload = {
  id: string;
  /** Chỉ ADMIN: chuyển học sinh sang gia sư khác. */
  tutorId?: string;
  /** Họ — BE `lastName`. */
  lastName?: string;
  /** Tên — BE `firstName`. */
  firstName?: string;
  studentPhone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  birthday?: string;
  school?: string;
  address?: string;
  district?: string;
  province?: string;
  /** Replaces (not adds to) the student's current class enrollment; "" un-enrolls. */
  classId?: string;
  /** Link an existing PARENT user; sent alone (without parent fields) so the shared parent is untouched. */
  parentId?: string;
  parentName?: string;
  /** Họ phụ huynh — BE `parentLastName`. */
  parentLastName?: string;
  /** Tên phụ huynh — BE `parentFirstName`. */
  parentFirstName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentRelationship?: string;
  parentAddress?: string;
  parentDistrict?: string;
  parentProvince?: string;
};
