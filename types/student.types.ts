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
  parentName: string;
  parentRelationship: string;
  parentPhone: string;
  parentEmail: string;
};

/** Matches POST /students (`createStudentSchema` on the backend). */
export type CreateStudentPayload = {
  studentName: string;
  userCode?: string;
  classCode?: string;
  gender: GENDER_ENUM;
  studentPhone?: string;
  school?: string;
  /** Link an existing PARENT user instead of creating one from `parentName`/`parentPhone`/... */
  parentId?: string;
  parentName?: string;
  parentRelationship?: string;
  parentPhone?: string;
  parentEmail?: string;
};

/** Existing PARENT user picked from search and linked to a student (not created from the form). */
export type ParentOption = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type Student = {
  id: string;
  /** Linked PARENT user id — null when the student has no parent account. */
  parentId: string | null;
  initials: string;
  avatarColor: string;
  name: string;
  subject: string;
  /** Current class id (enrolled via class_students) — null if not enrolled in any class. */
  classId: string | null;
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
  /** Parent contact info — nested object, not flat parentName/parentPhone/... fields. */
  parent?: ApiStudentParent | null;
  /** Enrolled class(es) — joined from class_students, not the (unused) legacy `classId` column above. */
  classes?: { id: string; name: string; code: string }[];
  classCount?: number;
  createdAt?: string;
  updatedAt?: string;
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
  studentName?: string;
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
  parentPhone?: string;
  parentEmail?: string;
  parentRelationship?: string;
  parentAddress?: string;
  parentDistrict?: string;
  parentProvince?: string;
};
