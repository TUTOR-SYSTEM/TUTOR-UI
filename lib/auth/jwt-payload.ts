/**
 * Decodes the payload segment of a JWT without verifying it (display/routing only; the server
 * enforces auth). Handles base64url (`-`/`_`, no padding) and UTF-8 content, which plain `atob`
 * does not. Returns `null` for a missing or malformed token.
 */
export function decodeJwtPayload<T>(token: string | null): T | null {
  const segment = token?.split(".")[1];
  if (!segment) return null;
  try {
    const base64 = segment
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(segment.length / 4) * 4, "=");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}
