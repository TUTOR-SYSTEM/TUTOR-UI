"use client";

import { AllClassesList } from "@/components/all-classes/all-classes-list";
import { ClassesPage } from "@/components/classes";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

/** `/classes`: ADMIN sees every class (with its tutor); other roles keep their own class page. */
export function ClassesRoute() {
  const role = useCurrentUserRole();
  return role === "ADMIN" ? <AllClassesList /> : <ClassesPage />;
}
