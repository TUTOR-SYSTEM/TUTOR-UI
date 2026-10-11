import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { useDelete, usePost, usePut } from "@/lib/axios/query";
import { CLASSES_QUERY_KEY, useClassActions } from "@/lib/services/class.service";

type Captured = {
  queryKey: unknown;
  url: string;
  options: { enabled?: boolean; params?: unknown; select: (raw: unknown) => unknown };
};

type Mutation = { url: unknown; options?: Record<string, unknown> };

describe("class.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list query", () => {
    it("defaults limit to 100 and is always enabled", () => {
      const list = useClassActions().list as unknown as Captured;
      expect(list.url).toBe("/classes");
      expect(list.options.enabled).toBeUndefined();
      expect(list.options.params).toEqual({ limit: 100 });
      expect(list.queryKey).toEqual([...CLASSES_QUERY_KEY, undefined]);
    });

    it("lets caller params override the default limit", () => {
      const list = useClassActions({ list: { limit: 20, page: 3 } }).list as unknown as Captured;
      expect(list.options.params).toEqual({ limit: 20, page: 3 });
      expect(list.queryKey).toEqual([...CLASSES_QUERY_KEY, { limit: 20, page: 3 }]);
    });

    it("merges listOptions over the defaults", () => {
      const list = useClassActions({ listOptions: { enabled: false } })
        .list as unknown as Captured;
      expect(list.options.enabled).toBe(false);
    });
  });

  describe("detail and students queries", () => {
    it("disables detail when no detailId is given and builds the url from it", () => {
      const detail = useClassActions().detail as unknown as Captured;
      expect(detail.options.enabled).toBe(false);
      expect(detail.url).toBe("/classes/");

      const withId = useClassActions({ detailId: "c1" }).detail as unknown as Captured;
      expect(withId.options.enabled).toBe(true);
      expect(withId.url).toBe("/classes/c1");
    });

    it("selects the students array from a normal payload", () => {
      const students = useClassActions({ studentsClassId: "c1" })
        .students as unknown as Captured;
      expect(students.url).toBe("/classes/c1/students");
      expect(students.options.select({ statusCode: 200, data: [{ id: "s1" }] })).toEqual([
        { id: "s1" },
      ]);
    });

    // KNOWN BUG: `unwrapApiData(...) ?? []` never falls back to [] because unwrapApiData
    // returns the whole envelope when `data` is null. Remove `.fails` once fixed.
    it.fails("returns an empty array for students when the payload data is null", () => {
      const students = useClassActions({ studentsClassId: "c1" })
        .students as unknown as Captured;
      expect(students.options.select({ statusCode: 200, data: null })).toEqual([]);
    });
  });

  describe("generateCode query", () => {
    it("unwraps the code string and falls back to empty string", () => {
      const generate = useClassActions().generateCode as unknown as Captured;
      expect(generate.url).toBe("/classes/generate-code");
      expect(generate.options.select({ data: { code: "CL-01" } })).toBe("CL-01");
      expect(generate.options.select({ data: null })).toBe("");
    });
  });

  describe("mutations", () => {
    it("create posts to /classes", () => {
      useClassActions();
      expect(usePost).toHaveBeenCalledWith("/classes");
    });

    it("update builds the url from payload.id", () => {
      useClassActions();
      const update = vi.mocked(usePut).mock.calls[0][0] as unknown as (p: { id: string }) => string;
      expect(update({ id: "abc" })).toBe("/classes/abc");
    });

    it("delete builds the url from the id string", () => {
      useClassActions();
      const del = vi.mocked(useDelete).mock.calls[0][0] as unknown as (id: string) => string;
      expect(del("xyz")).toBe("/classes/xyz");
    });

    it("enrollStudents posts to /classes/:classId/students", () => {
      useClassActions();
      const enrollCall = vi.mocked(usePost).mock.calls.find(
        ([url]) => typeof url === "function",
      );
      expect(enrollCall).toBeDefined();
      const enrollUrl = enrollCall?.[0] as unknown as (p: { classId: string }) => string;
      expect(enrollUrl({ classId: "c9" })).toBe("/classes/c9/students");
    });

    it("exposes every action under the expected key", () => {
      const result = useClassActions() as unknown as Record<string, Mutation>;
      expect(Object.keys(result).sort()).toEqual(
        ["create", "delete", "detail", "enrollStudents", "generateCode", "list", "students", "update"].sort(),
      );
    });
  });
});
