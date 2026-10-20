"use client";

import { useMutation, type UseMutationOptions } from "@tanstack/react-query";

import {
  apiPut,
  useGet,
  usePost,
  usePut,
  useDelete,
} from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import type {
  AdminStudentsApiPayload,
  AdminTutorsApiPayload,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
} from "@/types";

export type AdminListParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
};

type MutationOptions<TData, TPayload> = UseMutationOptions<
  TData,
  Error,
  TPayload
>;

// ── Tutors (/admin/tutors) ───────────────────────────────────────────────────

export function useAdminTutors(params?: AdminListParams, enabled = true) {
  return useGet<unknown, AdminTutorsApiPayload>(
    ["admin", "tutors", "list", params ?? {}],
    "/admin/tutors",
    {
      params: params as Record<string, unknown> | undefined,
      enabled,
      select: (raw) => unwrapApiData<AdminTutorsApiPayload>(raw),
    },
  );
}

export function useCreateTutor(
  options?: MutationOptions<unknown, CreateAdminUserPayload>,
) {
  return usePost<unknown, CreateAdminUserPayload>("/admin/tutors", options);
}

/** Bind the tutor id up front — the mutation body then carries only the update fields. */
export function useUpdateTutor(
  id: string,
  options?: MutationOptions<unknown, UpdateAdminUserPayload>,
) {
  return usePut<unknown, UpdateAdminUserPayload>(
    `/admin/tutors/${id}`,
    options,
  );
}

/**
 * Id travels with the payload so one hook can serve every row of the tutor list.
 * The id goes in the URL only: gateway `PUT /admin/tutors/:id` is `.strict()` and
 * rejects an `id` key in the body.
 */
export function useUpdateTutorById(
  options?: MutationOptions<unknown, { id: string } & UpdateAdminUserPayload>,
) {
  return useMutation<unknown, Error, { id: string } & UpdateAdminUserPayload>({
    mutationFn: ({ id, ...body }) =>
      apiPut<unknown, UpdateAdminUserPayload>(`/admin/tutors/${id}`, body),
    ...options,
  });
}

export function useDeleteTutor(options?: MutationOptions<unknown, string>) {
  return useDelete<unknown, string>((id) => `/admin/tutors/${id}`, options);
}

// ── Students (/admin/students) ───────────────────────────────────────────────

export function useAdminStudents(params?: AdminListParams, enabled = true) {
  return useGet<unknown, AdminStudentsApiPayload>(
    ["admin", "students", "list", params ?? {}],
    "/admin/students",
    {
      params: params as Record<string, unknown> | undefined,
      enabled,
      select: (raw) => unwrapApiData<AdminStudentsApiPayload>(raw),
    },
  );
}

export function useCreateStudent(
  options?: MutationOptions<unknown, CreateAdminUserPayload>,
) {
  return usePost<unknown, CreateAdminUserPayload>("/admin/students", options);
}

export function useUpdateStudent(
  id: string,
  options?: MutationOptions<unknown, UpdateAdminUserPayload>,
) {
  return usePut<unknown, UpdateAdminUserPayload>(
    `/admin/students/${id}`,
    options,
  );
}

export function useDeleteStudent(options?: MutationOptions<unknown, string>) {
  return useDelete<unknown, string>((id) => `/admin/students/${id}`, options);
}
