import { Suspense } from "react";

import ResetPass from "@/components/auth/reset-pass";
import { AuthScreen } from "@/components/auth/auth-ui";

export const metadata = {
  title: "Đặt lại mật khẩu | Tutor Pro",
  description: "Tạo mật khẩu mới cho tài khoản của bạn",
};

export default function ResetPasswordPage() {
  return (
    <AuthScreen>
      <Suspense
        fallback={
          <div className="relative z-10 h-[28rem] w-full max-w-[26.5rem] animate-pulse rounded-3xl bg-card/90 shadow-lg" />
        }
      >
        <ResetPass />
      </Suspense>
    </AuthScreen>
  );
}
