import { Suspense } from "react";

import { VerifyEmail } from "@/components/auth/verify-email";
import { AuthScreen } from "@/components/auth/auth-ui";

export const metadata = {
  title: "Xác minh email | Tutor Pro",
  description: "Xác minh địa chỉ email của tài khoản",
};

// No redirectIfAuthenticated: a signed-in user opening the emailed link must still be verified.
export default function VerifyEmailPage() {
  return (
    <AuthScreen>
      <Suspense
        fallback={
          <div className="relative z-10 h-[28rem] w-full max-w-[26.5rem] animate-pulse rounded-3xl bg-card/90 shadow-lg" />
        }
      >
        <VerifyEmail />
      </Suspense>
    </AuthScreen>
  );
}
