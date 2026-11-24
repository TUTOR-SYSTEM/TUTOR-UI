import { Suspense } from "react";

import VerifyOtp from "@/components/auth/verify-otp";
import { AuthScreen } from "@/components/auth/auth-ui";

export const metadata = {
  title: "Xác nhận mã | Tutor Pro",
  description: "Nhập mã xác nhận được gửi tới email của bạn",
};

export default function VerifyOtpPage() {
  return (
    <AuthScreen>
      <Suspense
        fallback={
          <div className="relative z-10 h-[24rem] w-full max-w-[26.5rem] animate-pulse rounded-3xl bg-card/90 shadow-lg" />
        }
      >
        <VerifyOtp />
      </Suspense>
    </AuthScreen>
  );
}
