import type { Metadata } from "next";

import { FlowRequestPage } from "@/components/flow-request";

export const metadata: Metadata = {
  title: "Request Flow",
};

export default function Page() {
  return <FlowRequestPage />;
}