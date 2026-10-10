import { describe, expect, it } from "vitest";

import {
  parseHeaders,
  buildCurl,
  buildPlaybackEvents,
  buildPlaybackLines,
  buildTraceTree,
  errorKindOf,
  pickScenarioFor,
  pipelineHops,
  playbackFrontier,
} from "@/components/logger/logger-utils";
import { loggerDictionary } from "@/lib/i18n/logger.dictionary";
import type { ApiRequestLog, ApiTestScenario } from "@/types";

const log = (over: Partial<ApiRequestLog>): ApiRequestLog => ({
  id: "1",
  serviceName: "gateway",
  type: "HTTP",
  method: "POST",
  path: "/auth/login",
  statusCode: 200,
  durationMs: 40,
  correlationId: "c1",
  traceId: "t1",
  parentTraceId: null,
  userId: null,
  ip: null,
  requestBody: null,
  responseBody: null,
  errorMessage: null,
  createdAt: "2030-01-01T10:00:00.100Z",
  ...over,
});

describe("buildCurl", () => {
  it("builds method, url, auth placeholder and body", () => {
    const curl = buildCurl(log({ requestBody: '{"a":"it\'s"}' }), "http://localhost:8888/");
    expect(curl).toContain("curl -X POST 'http://localhost:8888/auth/login'");
    expect(curl).toContain("Authorization: Bearer <ACCESS_TOKEN>");
    expect(curl).toContain("Content-Type: application/json");
    // single quote inside the body is shell-escaped
    expect(curl).toContain(`--data-raw '{"a":"it'\\''s"}'`);
  });

  it("omits body headers when there is no body", () => {
    const curl = buildCurl(log({ method: "GET", path: "/classes", requestBody: null }), "http://x");
    expect(curl).not.toContain("Content-Type");
    expect(curl).not.toContain("--data-raw");
  });
});

describe("pipelineHops", () => {
  it("makes one hop per service in first-seen order, worst tone wins", () => {
    const rows = [
      log({ id: "g", traceId: "g", createdAt: "2030-01-01T10:00:00.300Z", durationMs: 200 }),
      log({ id: "u1", serviceName: "user-service", type: "RPC", traceId: "u1", parentTraceId: "g", statusCode: 200, createdAt: "2030-01-01T10:00:00.200Z", durationMs: 50 }),
      log({ id: "u2", serviceName: "user-service", type: "RPC", traceId: "u2", parentTraceId: "g", statusCode: 500, createdAt: "2030-01-01T10:00:00.250Z", durationMs: 20 }),
    ];
    const hops = pipelineHops(buildTraceTree(rows));
    expect(hops.map((h) => h.service)).toEqual(["gateway", "user-service"]);
    expect(hops[1].tone).toBe("err");
  });
});


describe("pickScenarioFor", () => {
  const sc = (over: Partial<ApiTestScenario>): ApiTestScenario => ({
    id: "s",
    service: "user-service",
    method: "POST",
    path: "/auth/login",
    name: "n",
    description: null,
    requestTemplate: {},
    expectedStatus: 200,
    category: "validation",
    authProfile: "caller",
    createdAt: "",
    updatedAt: null,
    lastRun: null,
    flow: [],
    ...over,
  });
  const req = { method: "POST", path: "/auth/login", correlationId: "c1" };

  it("prefers the scenario that produced this request, then a valid case, then the first", () => {
    const own = sc({ id: "own", lastRun: { correlationId: "c1", actualStatus: 200, passed: true, durationMs: 1, runAt: "" } });
    const valid = sc({ id: "valid", category: "valid" });
    const other = sc({ id: "other" });
    expect(pickScenarioFor([other, valid, own], req)?.id).toBe("own");
    expect(pickScenarioFor([other, valid], req)?.id).toBe("valid");
    expect(pickScenarioFor([other], req)?.id).toBe("other");
  });

  it("ignores the query string and other endpoints; null when nothing matches", () => {
    expect(pickScenarioFor([sc({ id: "q", path: "/auth/login?x=1" })], req)?.id).toBe("q");
    expect(pickScenarioFor([sc({ method: "GET" })], req)).toBeNull();
  });
});

describe("playback", () => {
  // gateway → auth → (user → db), then back: enter/exit must nest like a call stack.
  const nodes = buildTraceTree([
    log({ id: "g", traceId: "g", durationMs: 90, createdAt: "2030-01-01T10:00:00.400Z" }),
    log({ id: "a", serviceName: "tutor-service", type: "RPC", traceId: "a", parentTraceId: "g", durationMs: 60, createdAt: "2030-01-01T10:00:00.350Z" }),
    log({ id: "u", serviceName: "user-service", type: "RPC", traceId: "u", parentTraceId: "a", durationMs: 30, createdAt: "2030-01-01T10:00:00.300Z" }),
  ]);

  it("builds enter/exit events like a call stack", () => {
    expect(buildPlaybackEvents(nodes).map((e) => `${e.kind}${e.index}`)).toEqual([
      "enter0", "enter1", "enter2", "exit2", "exit1", "exit0",
    ]);
    expect(buildPlaybackEvents([])).toEqual([]);
  });

  it("tracks where the request is: down into the deepest hop, then back up to the client", () => {
    const events = buildPlaybackEvents(nodes);
    expect(playbackFrontier(nodes, events, 0).current).toBeNull();

    const deep = playbackFrontier(nodes, events, 3);
    expect(deep.current).toBe(2);
    expect(deep.direction).toBe("going");
    expect([...deep.entered]).toEqual([0, 1, 2]);

    const back = playbackFrontier(nodes, events, 4);
    expect(back.current).toBe(1); // user-service returned to its caller
    expect(back.direction).toBe("returning");

    expect(playbackFrontier(nodes, events, 6).current).toBeNull(); // root returned to the client
  });
});

describe("playback of a failed run", () => {
  // gateway → tutor → user (deadline exceeded); the previous run also reached the database.
  const failed = buildTraceTree([
    log({ id: "g", traceId: "g", statusCode: 504, durationMs: 3080, createdAt: "2030-01-01T10:00:03.400Z" }),
    log({ id: "a", serviceName: "tutor-service", type: "RPC", method: null, path: "grpc://class/AddMember", traceId: "a", parentTraceId: "g", statusCode: null, durationMs: 3030, createdAt: "2030-01-01T10:00:03.350Z" }),
    log({
      id: "u",
      serviceName: "user-service",
      type: "RPC",
      method: null,
      path: "grpc://user/GetUser",
      traceId: "u",
      parentTraceId: "a",
      statusCode: null,
      durationMs: 3000,
      errorMessage: "4 DEADLINE_EXCEEDED — user-service: GetUser deadline exceeded (3000ms)",
      createdAt: "2030-01-01T10:00:03.300Z",
    }),
  ]);
  const scenario = { method: "POST", path: "/classes/1/members", name: "Thêm thành viên", expectedStatus: 201 } as ApiTestScenario;

  it("adds an error event after the failing hop and skips services the old path reached", () => {
    const events = buildPlaybackEvents(failed, ["gateway", "tutor-service", "user-service", "third-service"]);
    expect(events.map((e) => (e.kind === "skip" ? `skip:${e.service}` : `${e.kind}${e.index}`))).toEqual([
      "enter0", "enter1", "enter2", "error2", "skip:third-service", "exit2", "exit1", "exit0",
    ]);
    expect(playbackFrontier(failed, events, 5).skipped).toEqual(["third-service"]);
    expect(playbackFrontier(failed, events, 4).skipped).toEqual([]);
  });

  it("writes one line per event with error / skipped / failing-result wording", () => {
    const events = buildPlaybackEvents(failed, ["third-service"]);
    const lines = buildPlaybackLines({
      nodes: failed,
      events,
      scenario,
      correlationId: "c1",
      actualStatus: 504,
      copy: loggerDictionary.vi.detail.live,
    });
    expect(lines).toHaveLength(events.length + 2);
    const texts = lines.map((l) => l.text);
    expect(texts).toContain("✕ User Service lỗi · 4 DEADLINE_EXCEEDED — user-service: GetUser deadline exceeded (3000ms)");
    expect(texts).toContain("○ Third Service · bỏ qua");
    expect(texts).toContain("← User Service → Tutor Service · 4 DEADLINE_EXCEEDED · 3.00s");
    expect(texts).toContain("Client nhận 504 Gateway Timeout · tổng 3.08s");
    expect(texts.at(-1)).toBe("● Kết quả: Lỗi · kỳ vọng 201, nhận 504");
    expect(lines.at(-1)?.tone).toBe("fail");
  });

  it("classifies the failure for the fix hint", () => {
    expect(errorKindOf({ errorMessage: "4 DEADLINE_EXCEEDED — x", statusCode: null })).toBe("timeout");
    expect(errorKindOf({ errorMessage: "14 UNAVAILABLE", statusCode: null })).toBe("unavailable");
    expect(errorKindOf({ errorMessage: null, statusCode: 500 })).toBe("server");
    expect(errorKindOf({ errorMessage: null, statusCode: 403 })).toBe("client");
    expect(errorKindOf({ errorMessage: null, statusCode: 200 })).toBeNull();
  });
});

describe("parseHeaders", () => {
  it("parses a JSON map into sorted pairs and returns null for empty/invalid input", () => {
    expect(parseHeaders('{"b":"2","a":1}')).toEqual([["a", "1"], ["b", "2"]]);
    expect(parseHeaders(null)).toBeNull();
    expect(parseHeaders("{}")).toBeNull();
    expect(parseHeaders("[1]")).toBeNull();
    expect(parseHeaders("nope")).toBeNull();
  });
});
