import { formatPersonName } from "@/lib/format/person-name";
import type { ApiStudent, Language, Student } from "@/types";

export function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return (parts[0][0] ?? "?").toUpperCase();
  return (
    (parts[parts.length - 2]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
}

export function mapApiToStudent(api: ApiStudent, language: Language): Student {
  // Họ Tên order (VI) / First Last (EN) — same rule as the tutors page.
  const fullName = formatPersonName(api.firstName, api.lastName, language) || api.username || "";
  const parentName = api.parent
    ? formatPersonName(api.parent.firstName, api.parent.lastName, language) ||
      api.parent.username ||
      ""
    : "";
  const classes = api.classes ?? [];
  return {
    id: api.id,
    tutorId: api.tutorId ?? null,
    parentId: api.parentId ?? null,
    initials: initials(fullName),
    avatarColor: "#0E9F8E",
    name: fullName,
    firstName: api.firstName?.trim() ?? "",
    lastName: api.lastName?.trim() ?? "",
    subject: "",
    classId: classes[0]?.id ?? null,
    classCode: classes.map((c) => c.code).join(", "),
    studentId: api.userCode ?? "",
    phone: api.phone ?? "",
    gender: api.gender ?? null,
    dateOfBirth: api.dateOfBirth ?? null,
    school: api.school ?? null,
    address: api.address ?? null,
    district: api.district ?? null,
    province: api.province ?? null,
    parentName,
    parentFirstName: api.parent?.firstName?.trim() ?? "",
    parentLastName: api.parent?.lastName?.trim() ?? "",
    parentPhone: api.parent?.phone ?? "",
    parentEmail: api.parent?.email ?? null,
    parentRelationship: api.parent?.relationship ?? null,
    parentAddress: api.parent?.address ?? null,
    parentDistrict: api.parent?.district ?? null,
    parentProvince: api.parent?.province ?? null,
  };
}
