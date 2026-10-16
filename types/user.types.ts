export type ApiUser = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  role?: string;
  subjects?: string | null;
  description?: string | null;
  address?: string | null;
  district?: string | null;
  province?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  subjects?: string;
  description?: string;
  address?: string;
  district?: string;
  province?: string;
  avatar?: string | null;
};

/** `PUT /users` body — profile self-edit (different shape from `UpdateUserPayload`, no `avatar`). */
export type UpdateUserProfilePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  subjects?: string;
  description?: string;
  address?: string;
  district?: string;
  province?: string;
};

/** `POST /users/change-password` body. */
export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

/** `POST /users/change-password` response. */
export type ChangePasswordResult = { message: string };

/** Grade row from `GET /users/grades` / `GET /curriculum/grades`. */
export type UserGrade = { id: string; name: string; level: number };

export type ManagedUserRole = "ADMIN" | "TUTOR" | "STUDENT" | "PARENT";

export type ApiManagedUser = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  role: ManagedUserRole;
  isActive: boolean;
  subjects?: string[] | null;
  classCount?: number;
  studentCount?: number;
  createdAt?: string;
};

export type ManagedUsersApiPayload = {
  data: ApiManagedUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/** `POST /users` body — gateway `createUserSchema` (password 8–20 chars required). */
export type CreateManagedUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: ManagedUserRole;
  password: string;
};

export type UpdateManagedUserPayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: ManagedUserRole;
};

// ── Admin module (/admin/tutors, /admin/students) ────────────────────────────
// The BE returns paginated lists keyed by resource name, not `data`.

export type AdminGender = "MALE" | "FEMALE" | "OTHER";

export type AdminPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AdminTutorsApiPayload = {
  tutors: ApiManagedUser[];
  pagination: AdminPagination;
};

export type AdminStudentsApiPayload = {
  students: ApiManagedUser[];
  pagination: AdminPagination;
};

/** Body for `POST /admin/tutors` and `POST /admin/students`. */
export type CreateAdminUserPayload = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  username?: string;
  phone?: string;
  gender?: AdminGender;
  dateOfBirth?: string;
  school?: string;
  subjects?: string[];
  description?: string;
  isActive?: boolean;
};

/** Body for `PUT /admin/tutors/:id` and `PUT /admin/students/:id` (no password). */
export type UpdateAdminUserPayload = {
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string | null;
  gender?: AdminGender | null;
  dateOfBirth?: string | null;
  school?: string | null;
  subjects?: string[] | null;
  description?: string | null;
  avatar?: string | null;
  isActive?: boolean;
};
