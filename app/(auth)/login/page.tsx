import { LoginForm } from "@/components/auth/login-form";
import { AuthScreen } from "@/components/auth/auth-ui";
import { LoginTopRight } from "@/components/auth/auth-top-right";

export const metadata = {
  title: "Đăng nhập | Gia Sư Pro",
  description: "Đăng nhập để quản lý lớp học và học sinh",
};

export default function LoginPage() {
  return (
    <AuthScreen topRight={<LoginTopRight />}>
      <LoginForm />
    </AuthScreen>
  );
}
