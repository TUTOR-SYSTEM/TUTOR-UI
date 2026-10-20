export type Role = "admin" | "student" | "parent";
export type ApiRole = "STUDENT" | "PARENT";
export type LoginPayload =
  | { email: string; password: string }
  | { userCode: string; password: string; role: ApiRole };

export const resolveLoginUrl = (payload: LoginPayload) =>
  "userCode" in payload ? "/auth/login/user-code" : "/auth/login";

export type LoginFormValues = {
  email: string;
  identifier: string;
  password: string;
};

/** Body `POST /auth/login*`. Refresh token không nằm trong body — gateway set cookie httpOnly. */
export type LoginResponse = {
  accessToken?: string;
  access_token?: string;
  token?: string;
  user?: unknown;
};

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
};

/** `POST /auth/logout` (cần access token). Gateway xóa cookie refresh và session phía server. */
export type LogoutResponse = { message: string };

export type ForgotPasswordPayload = { email: string };
export type ForgotPasswordResponse = { ok: boolean };

export type ResetPasswordPayload = {
  jti: string;
  password: string;
  confirmPassword: string;
};
export type ResetPasswordResponse = { ok: boolean };

export type VerifyEmailPayload = { jti: string };
export type VerifyEmailResponse = { ok: boolean };
