import { beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/lib/axios/query", () => ({
  useGet: vi.fn((queryKey: unknown, url: string, options: Record<string, unknown>) => ({
    queryKey,
    url,
    options,
  })),
  usePost: vi.fn((url: unknown, options?: Record<string, unknown>) => ({ url, options })),
  usePut: vi.fn((url: unknown, options?: Record<string, unknown>) => ({ url, options })),
  useDelete: vi.fn((url: unknown, options?: Record<string, unknown>) => ({ url, options })),
}));

vi.mock("@/lib/axios", () => ({
  axiosInstance: { get: http.get, post: http.post },
}));

import { usePost, usePut, useDelete } from "@/lib/axios/query";
import {
  STUDENTS_QUERY_KEY,
  apiDownloadFile,
  apiUploadFile,
  useStudentActions,
} from "@/lib/services/student.service";

type Captured = {
  queryKey: unknown;
  url: string;
  options: { enabled: boolean; select: (raw: unknown) => unknown } & Record<string, unknown>;
};

describe("student.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    http.get.mockReset();
    http.post.mockReset();
  });

  describe("useStudentActions — list query", () => {
    it("is disabled when no list args are passed", () => {
      const result = useStudentActions();
      const list = result.list as unknown as Captured;
      expect(list.url).toBe("/students");
      expect(list.options.enabled).toBe(false);
      expect(list.queryKey).toEqual([...STUDENTS_QUERY_KEY, undefined]);
    });

    it("is enabled and forwards params when list args are passed", () => {
      const params = { page: 2, limit: 10, search: "an", gender: "MALE", isActive: true };
      const result = useStudentActions({ list: params });
      const list = result.list as unknown as Captured;
      expect(list.options.enabled).toBe(true);
      expect(list.options.params).toEqual(params);
      expect(list.queryKey).toEqual([...STUDENTS_QUERY_KEY, params]);
    });

    it("keys the cache by the full filter object so each filter has its own entry", () => {
      const a = useStudentActions({ list: { page: 1 } }).list as unknown as Captured;
      const b = useStudentActions({ list: { page: 2 } }).list as unknown as Captured;
      expect(a.queryKey).not.toEqual(b.queryKey);
    });

    it("unwraps the envelope in select", () => {
      const list = useStudentActions({ list: { page: 1 } }).list as unknown as Captured;
      const payload = { students: [{ id: "s1" }], pagination: { total: 1, page: 1, limit: 10, totalPages: 1 } };
      expect(list.options.select({ statusCode: 200, data: payload })).toEqual(payload);
    });

    it("lets listOptions override the default enabled flag", () => {
      const list = useStudentActions({
        list: { page: 1 },
        listOptions: { enabled: false },
      }).list as unknown as Captured;
      expect(list.options.enabled).toBe(false);
    });
  });

  describe("useStudentActions — detail query", () => {
    it("is disabled without a detailId and uses an empty id segment", () => {
      const detail = useStudentActions().detail as unknown as Captured;
      expect(detail.url).toBe("/students/");
      expect(detail.options.enabled).toBe(false);
    });

    it("targets /students/:id when detailId is set", () => {
      const detail = useStudentActions({ detailId: "abc" }).detail as unknown as Captured;
      expect(detail.url).toBe("/students/abc");
      expect(detail.options.enabled).toBe(true);
      expect(detail.queryKey).toEqual([...STUDENTS_QUERY_KEY, "detail", "abc"]);
    });

    it("unwraps the student from the envelope", () => {
      const detail = useStudentActions({ detailId: "abc" }).detail as unknown as Captured;
      expect(detail.options.select({ data: { id: "abc", firstName: "An" } })).toEqual({
        id: "abc",
        firstName: "An",
      });
    });

    it("merges detailOptions after the defaults", () => {
      const detail = useStudentActions({
        detailId: "abc",
        detailOptions: { enabled: false, staleTime: 5000 },
      }).detail as unknown as Captured;
      expect(detail.options.enabled).toBe(false);
      expect(detail.options.staleTime).toBe(5000);
    });
  });

  describe("useStudentActions — generate code", () => {
    it("fetches the next student code from the dedicated endpoint", () => {
      const gen = useStudentActions().generateCode as unknown as Captured;
      expect(gen.url).toBe("/students/get-student-code");
      expect(gen.queryKey).toEqual([...STUDENTS_QUERY_KEY, "generate-code"]);
      expect(gen.options.select({ data: "HS-0001" })).toBe("HS-0001");
    });

    it("applies generateCodeOptions overrides", () => {
      const gen = useStudentActions({
        generateCodeOptions: { enabled: false },
      }).generateCode as unknown as Captured;
      expect(gen.options.enabled).toBe(false);
    });
  });

  describe("useStudentActions — mutations", () => {
    it("create posts to /students", () => {
      const r = useStudentActions();
      expect(vi.mocked(usePost)).toHaveBeenCalledWith("/students");
      expect(r.create).toBeDefined();
    });

    it("update builds the URL from the payload id", () => {
      const r = useStudentActions();
      expect(r.update).toBeDefined();
      const [urlFn] = vi.mocked(usePut).mock.calls[0];
      expect((urlFn as (p: { id: string }) => string)({ id: "xyz" })).toBe("/students/xyz");
    });

    it("delete builds the URL from the id", () => {
      useStudentActions();
      const [urlFn] = vi.mocked(useDelete).mock.calls[0];
      expect((urlFn as (id: string) => string)("xyz")).toBe("/students/xyz");
    });

    it("exposes the mutations under create/update/delete keys", () => {
      const r = useStudentActions();
      expect(Object.keys(r)).toEqual(
        expect.arrayContaining(["list", "detail", "generateCode", "create", "update", "delete"]),
      );
    });
  });

  describe("apiUploadFile", () => {
    it("posts a multipart FormData with the file and returns the unwrapped result", async () => {
      http.post.mockResolvedValue({ data: { statusCode: 200, data: { key: "k1", url: "u1" } } });
      const file = new File(["hello"], "a.txt", { type: "text/plain" });

      const result = await apiUploadFile(file);

      expect(http.post).toHaveBeenCalledTimes(1);
      const [url, body, config] = http.post.mock.calls[0];
      expect(url).toBe("/upload");
      expect(body).toBeInstanceOf(FormData);
      expect((body as FormData).get("file")).toBeInstanceOf(File);
      expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } });
      expect(result).toEqual({ key: "k1", url: "u1" });
    });

    it("propagates upload errors to the caller", async () => {
      http.post.mockRejectedValue(new Error("network down"));
      await expect(apiUploadFile(new File(["x"], "x.txt"))).rejects.toThrow("network down");
    });
  });

  describe("apiDownloadFile", () => {
    it("requests the blob for the given key and returns response.data", async () => {
      const blob = new Blob(["abc"]);
      http.get.mockResolvedValue({ data: blob });

      const result = await apiDownloadFile("folder/key.pdf");

      expect(http.get).toHaveBeenCalledWith("/upload/download", {
        params: { key: "folder/key.pdf" },
        responseType: "blob",
      });
      expect(result).toBe(blob);
    });

    it("propagates download errors", async () => {
      http.get.mockRejectedValue(new Error("404"));
      await expect(apiDownloadFile("missing")).rejects.toThrow("404");
    });
  });
});
