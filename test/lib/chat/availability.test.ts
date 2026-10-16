import { describe, expect, it } from "vitest";

import { CHAT_AVAILABLE } from "@/lib/chat/availability";

describe("CHAT_AVAILABLE", () => {
  it("stays off until gateway proxies the chat endpoints and /chat socket namespace", () => {
    expect(CHAT_AVAILABLE).toBe(false);
  });
});
