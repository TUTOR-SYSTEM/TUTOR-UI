import { classifyComplexity } from "@/lib/jev/classify";

export async function POST(request: Request): Promise<Response> {
  if (!process.env.TYPESAFE_API_KEY) {
    return Response.json({ message: "TYPESAFE_API_KEY chưa được cấu hình" }, { status: 500 });
  }
  if (!request.headers.get("authorization")?.startsWith("Bearer ")) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { task?: unknown } | null;
  if (typeof body?.task !== "string" || !body.task.trim()) {
    return Response.json({ message: "Thiếu `task`" }, { status: 400 });
  }
  try {
    return Response.json(await classifyComplexity(body.task));
  } catch (err) {
    return Response.json(
      { message: err instanceof Error ? err.message : "Jev lỗi" },
      { status: 502 },
    );
  }
}
