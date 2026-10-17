import ForgotPass from "@/components/auth/forgot-pass";
import { AuthScreen } from "@/components/auth/auth-ui";

export const metadata = {
  title: "Quên mật khẩu | Gia Sư Pro",
  description: "Đặt lại mật khẩu tài khoản Gia Sư Pro",
};

export default function ForgotPasswordPage() {
  return (
    <AuthScreen>
      <ForgotPass />
    </AuthScreen>
  );
}
