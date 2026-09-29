import type { Metadata } from "next";

import { TestMonitorPage } from "@/components/test-monitor/test-monitor-page";

export const metadata: Metadata = {
  title: "Kiểm thử endpoint",
};

export default function Page() {
  return <TestMonitorPage />;
}
