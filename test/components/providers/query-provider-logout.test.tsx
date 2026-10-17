import { act, render } from "@testing-library/react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";

import { QueryProvider } from "@/components/providers/query.provider";
import { useAuthStore } from "@/zustand/auth.store";

function Probe({ onClient }: { onClient: (client: QueryClient) => void }) {
  onClient(useQueryClient());
  return null;
}

function renderProvider() {
  let client: QueryClient | null = null;
  render(
    <QueryProvider>
      <Probe onClient={(c) => (client = c)} />
    </QueryProvider>,
  );
  if (!client) throw new Error("QueryClient not captured");
  return client as QueryClient;
}

describe("QueryProvider sign-out", () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: "token-a", user: null }, false);
  });

  it("clears the cached queries of the previous user when the session is cleared", () => {
    const client = renderProvider();
    client.setQueryData(["classes", "list"], { classes: ["secret"] });
    expect(client.getQueryData(["classes", "list"])).toBeDefined();

    act(() => {
      useAuthStore.getState().clearAuth();
    });

    expect(client.getQueryData(["classes", "list"])).toBeUndefined();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it("keeps the cache while the token is merely replaced (not a sign-out)", () => {
    const client = renderProvider();
    client.setQueryData(["students"], { students: [] });

    act(() => {
      useAuthStore.getState().setCredentials({ accessToken: "token-b" });
    });

    expect(client.getQueryData(["students"])).toEqual({ students: [] });
  });
});
