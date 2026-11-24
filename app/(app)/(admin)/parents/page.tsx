import type { Metadata } from "next";

import { ParentsPage } from "@/components/parents/parents-page";

export const metadata: Metadata = {
  title: "Quản lý phụ huynh",
};

export default function Page() {
  return <ParentsPage />;
}
