import type { Metadata } from "next";

import { LoggerPage } from "@/components/logger/logger-page";

export const metadata: Metadata = {
  title: "Nhật ký request",
};

export default function Page() {
  return <LoggerPage />;
}
