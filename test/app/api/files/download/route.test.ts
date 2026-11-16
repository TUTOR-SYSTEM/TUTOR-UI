import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/files/download/route";

const makeRequest = (search: string, headers: Record<string, string> = {}) =>
  new Request(`http://localhost:3000/api/files/download${search}`, { headers });

describe("GET /api/files/download", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 when key is missing", async () => {
    const res = await GET(makeRequest("", { authorization: "Bearer t" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when the request has no Authorization header", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(makeRequest("?key=uploads%2Fa.pdf"));
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the Bearer token to the gateway and streams the followed file back", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("file-body", {
        status: 200,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'attachment; filename="a.pdf"',
          "x-r2-internal": "hidden",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(
      makeRequest("?key=uploads%2Fa%20b.pdf", { authorization: "Bearer tok" }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/upload/download?key=uploads%2Fa%20b.pdf");
    expect(init.redirect).toBe("follow");
    expect(init.headers).toEqual({ Authorization: "Bearer tok" });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="a.pdf"');
    expect(res.headers.get("x-r2-internal")).toBeNull();
    expect(await res.text()).toBe("file-body");
  });

  it("passes upstream error status and message through", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "PERMISSION_DENIED" }), {
          status: 403,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const res = await GET(makeRequest("?key=uploads%2Fa.pdf", { authorization: "Bearer t" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: "PERMISSION_DENIED" });
  });
});
