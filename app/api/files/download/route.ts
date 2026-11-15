const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8888";

/**
 * Proxy tải tệp cùng origin. Gateway `GET /upload/download` trả 302 sang URL presigned của R2
 * (khác origin, không có header CORS) nên trình duyệt chặn khi XHR đi theo redirect. Route này
 * chạy phía server: gửi Bearer token của người dùng tới gateway, để fetch tự theo redirect rồi
 * stream nội dung về trình duyệt qua cùng origin.
 */
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  const authorization = request.headers.get("authorization");

  if (!key) {
    return Response.json({ message: "key query param is required" }, { status: 400 });
  }
  if (!authorization) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const upstream = await fetch(
    `${API_BASE_URL}/upload/download?key=${encodeURIComponent(key)}`,
    {
      headers: { Authorization: authorization },
      redirect: "follow",
      cache: "no-store",
    },
  );

  if (!upstream.ok || !upstream.body) {
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  }

  const headers = new Headers();
  for (const name of ["content-type", "content-length", "content-disposition"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.body, { status: 200, headers });
}
