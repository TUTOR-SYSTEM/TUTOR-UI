import type { Metadata } from "next";

import { LoggerPage } from "@/components/logger/logger-page";

export const metadata: Metadata = {
  title: "Giám sát Request",
};

export default function Page() {
  return <LoggerPage />;
}
