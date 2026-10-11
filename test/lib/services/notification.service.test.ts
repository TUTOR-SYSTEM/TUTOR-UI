import { beforeEach, describe, expect, it, vi } from "vitest";

const mutationOptions = vi.hoisted(() => ({ last: undefined as undefined | { mutationFn: (id: string) => unknown } }));
const apiPatch = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn((options: { mutationFn: (id: string) => unknown }) => {
    mutationOptions.last = options;
    return options;
  }),
}));

vi.mock("@/lib/axios/query", () => ({
  useGet: vi.fn((queryKey: unknown, url: string, options: Record<string, unknown>) => ({ queryKey, url, options })),
  usePost: vi.fn((url: unknown) => ({ url })),
  usePatch: vi.fn((url: unknown) => ({ url })),
  useDelete: vi.fn((url: unknown) => ({ url })),
  apiPatch,
}));

import {
  NOTIFICATIONS_QUERY_KEY,
  useNotificationActions,
} from "@/lib/services/notification.service";

type Captured = {
  queryKey: unknown;
  url: string;
  options: { enabled: boolean; select: (raw: unknown) => unknown } & Record<string, unknown>;
};

describe("notification.service", () => {
  beforeEach(() => {
    apiPatch.mockReset();
    mutationOptions.last = undefined;
  });

  describe("list query", () => {
    it("is disabled when no list args are passed", () => {
      const list = useNotificationActions().list as unknown as Captured;
      expect(list.url).toBe("/notifications");
      expect(list.options.enabled).toBe(false);
      expect(list.queryKey).toEqual([...NOTIFICATIONS_QUERY_KEY, undefined]);
    });

    it("forwards filter params (type, isRead) to the request", () => {
      const params = { page: 1, limit: 20, type: "SESSION", isRead: false };
      const list = useNotificationActions({ list: params }).list as unknown as Captured;
      expect(list.options.enabled).toBe(true);
      expect(list.options.params).toEqual(params);
    });

    it("passes an object envelope through unchanged", () => {
      const list = useNotificationActions({ list: { page: 1 } }).list as unknown as Captured;
      const payload = {
        data: [{ id: "n1" }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      expect(list.options.select({ data: payload })).toEqual(payload);
    });

    it("wraps a flat array into a single-page payload", () => {
      const list = useNotificationActions({ list: { page: 1 } }).list as unknown as Captured;
      const items = [{ id: "n1" }, { id: "n2" }];
      expect(list.options.select({ data: items })).toEqual({
        data: items,
        pagination: { total: 2, page: 1, limit: 2, totalPages: 1 },
      });
    });

    it("returns an empty single-page payload for an empty array", () => {
      const list = useNotificationActions({ list: { page: 1 } }).list as unknown as Captured;
      expect(list.options.select({ data: [] })).toEqual({
        data: [],
        pagination: { total: 0, page: 1, limit: 0, totalPages: 1 },
      });
    });

    it("lets listOptions override the default select", () => {
      const select = vi.fn();
      const list = useNotificationActions({
        list: { page: 1 },
        listOptions: { select },
      }).list as unknown as Captured;
      list.options.select({ data: [] });
      expect(select).toHaveBeenCalled();
    });
  });

  describe("detail query", () => {
    it("is disabled without detailId", () => {
      const detail = useNotificationActions().detail as unknown as Captured;
      expect(detail.url).toBe("/notifications/");
      expect(detail.options.enabled).toBe(false);
    });

    it("targets the notification by id and unwraps it", () => {
      const detail = useNotificationActions({ detailId: "n9" }).detail as unknown as Captured;
      expect(detail.url).toBe("/notifications/n9");
      expect(detail.options.enabled).toBe(true);
      expect(detail.options.select({ data: { id: "n9" } })).toEqual({ id: "n9" });
    });
  });

  describe("mutations", () => {
    it("markRead patches /notifications/:id/read through apiPatch", async () => {
      apiPatch.mockResolvedValue({ data: { id: "n1", isRead: true } });
      useNotificationActions();

      const options = mutationOptions.last!;
      const result = await options.mutationFn("n1");

      expect(apiPatch).toHaveBeenCalledWith("/notifications/n1/read", undefined);
      expect(result).toEqual({ data: { id: "n1", isRead: true } });
    });

    it("markAllRead patches /notifications/read-all", () => {
      const { markAllRead } = useNotificationActions();
      expect(markAllRead).toEqual({ url: "/notifications/read-all" });
    });

    it("delete builds the URL from the id", () => {
      const { delete: del } = useNotificationActions();
      expect((del as unknown as { url: (id: string) => string }).url("n5")).toBe("/notifications/n5");
    });

    it("create posts to /notifications", () => {
      const { create } = useNotificationActions();
      expect(create).toEqual({ url: "/notifications" });
    });
  });
});
