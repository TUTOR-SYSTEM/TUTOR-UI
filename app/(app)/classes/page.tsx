import type { Metadata } from "next";

import { ClassesRoute } from "@/components/classes/classes-route";

export const metadata: Metadata = {
  title: "Classes",
};

export default function Page() {
  return <ClassesRoute />;
}
