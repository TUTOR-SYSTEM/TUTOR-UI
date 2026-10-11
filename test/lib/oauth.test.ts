import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("oauth", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "http://localhost:3000/login" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
    vi.unstubAllEnvs();
  });

  it("redirects to the default backend Google endpoint when env is empty", async () => {
    const { startGoogleOAuth } = await import("@/lib/oauth");
    startGoogleOAuth();
    expect(window.location.href).toBe("http://localhost:8888/auth/google");
  });

  it("redirects to the default backend Facebook endpoint when env is empty", async () => {
    const { startFacebookOAuth } = await import("@/lib/oauth");
    startFacebookOAuth();
    expect(window.location.href).toBe("http://localhost:8888/auth/facebook");
  });

  it("uses NEXT_PUBLIC_API_URL (trimmed) as the base", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "  https://api.example.com  ");
    const { startGoogleOAuth, startFacebookOAuth } = await import("@/lib/oauth");
    startGoogleOAuth();
    expect(window.location.href).toBe("https://api.example.com/auth/google");
    startFacebookOAuth();
    expect(window.location.href).toBe("https://api.example.com/auth/facebook");
  });
});
