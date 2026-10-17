import { RegisterForm } from "@/components/auth/register-form";
import { AuthScreen } from "@/components/auth/auth-ui";
import { RegisterTopRight } from "@/components/auth/auth-top-right";

export const metadata = {
  title: "Đăng ký | Gia Sư Pro",
  description: "Tạo tài khoản để bắt đầu quản lý lớp học",
};

export default function RegisterPage() {
  return (
    <AuthScreen topRight={<RegisterTopRight />}>
      <RegisterForm />
    </AuthScreen>
  );
}
