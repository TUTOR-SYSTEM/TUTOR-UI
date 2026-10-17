import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8888";

export const unwrapNestPayload = <T extends Record<string, unknown>>(
  body: unknown,
): T | undefined => {
  if (!body || typeof body !== "object") {
    return undefined;
  }
  const o = body as Record<string, unknown>;
  if ("data" in o && o.data && typeof o.data === "object") {
    return o.data as T;
  }
  return body as T;
};

/**
 * `POST /auth/refresh` — refresh token nằm trong cookie httpOnly `refresh_token` (gateway set,
 * `path=/auth`), nên không gửi body và phải bật `withCredentials`. Trả access token mới; cookie
 * được xoay vòng phía server. Không dùng `axiosInstance` để tránh gắn Bearer access đã hết hạn.
 */
export async function postAuthRefresh(): Promise<{ accessToken: string }> {
  const res = await axios.post<unknown>(
    `${API_BASE_URL}/auth/refresh`,
    undefined,
    {
      headers: { "Content-Type": "application/json" },
      timeout: 10_000,
      withCredentials: true,
    },
  );
  const inner = unwrapNestPayload<{ accessToken?: unknown }>(res.data);
  const accessToken = inner?.accessToken;
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("Invalid refresh response");
  }
  return { accessToken };
}
