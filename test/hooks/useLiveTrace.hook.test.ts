import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveTrace } from "@/hooks/useLiveTrace.hook";
import type { ApiRequestLog, ApiTestScenario } from "@/types";

const scenario = { id: "s1", expectedStatus: 200 } as ApiTestScenario;
const row = (over: Partial<ApiRequestLog>): ApiRequestLog =>
  ({
    id: "r",
    serviceName: "gateway",
    type: "HTTP",
    statusCode: 200,
    correlationId: "c1",
    ...over,
  }) as ApiRequestLog;

describe("useLiveTrace", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("collects only rows of the followed correlationId, without duplicates", () => {
    const { result } = renderHook(() => useLiveTrace());
    act(() => result.current.start("c1", scenario));

    act(() => {
      result.current.feed(row({ id: "a", serviceName: "user-service", type: "RPC" }));
      result.current.feed(row({ id: "a", serviceName: "user-service", type: "RPC" }));
      result.current.feed(row({ id: "x", correlationId: "other" }));
    });
    expect(result.current.live?.rows.map((r) => r.id)).toEqual(["a"]);
    expect(result.current.live?.phase).toBe("running");
  });

  it("settles when the gateway root arrives, then is done after the settle delay", () => {
    const { result } = renderHook(() => useLiveTrace());
    act(() => result.current.start("c1", scenario));

    act(() => result.current.feed(row({ id: "g", statusCode: 401 })));
    expect(result.current.live).toMatchObject({ phase: "settling", rootStatus: 401 });

    act(() => void vi.advanceTimersByTime(600));
    expect(result.current.live?.phase).toBe("done");
  });

  it("gives up if nothing ever arrives", () => {
    const { result } = renderHook(() => useLiveTrace());
    act(() => result.current.start("c1", scenario));
    act(() => void vi.advanceTimersByTime(20_001));
    expect(result.current.live?.phase).toBe("done");
  });

  it("a new start replaces the old run and ignores its late rows", () => {
    const { result } = renderHook(() => useLiveTrace());
    act(() => result.current.start("c1", scenario));
    act(() => result.current.start("c2", scenario));
    act(() => result.current.feed(row({ id: "late", correlationId: "c1" })));
    expect(result.current.live).toMatchObject({ correlationId: "c2", rows: [] });
  });
});
