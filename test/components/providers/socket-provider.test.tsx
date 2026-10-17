import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ioMock = vi.hoisted(() => vi.fn());
const chat = vi.hoisted(() => ({ available: true }));

vi.mock("socket.io-client", () => ({ io: ioMock }));
vi.mock("@/lib/chat/availability", () => ({
  get CHAT_AVAILABLE() {
    return chat.available;
  },
}));

import { SocketProvider, useSocket } from "@/components/providers/socket.provider";
import { useAuthStore } from "@/zustand/auth.store";

type FakeSocket = {
  auth: (cb: (data: { token: string | null }) => void) => void;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

const createdSockets: FakeSocket[] = [];

/** Đọc token mà socket sẽ gửi ở lần kết nối kế tiếp. */
function tokenSentBy(socket: FakeSocket): string | null | undefined {
  let sent: string | null | undefined;
  socket.auth((data) => {
    sent = data.token;
  });
  return sent;
}

function fakeSocket(options: { auth: FakeSocket["auth"] }): FakeSocket {
  const socket: FakeSocket = {
    auth: options.auth,
    on: vi.fn(),
    off: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  createdSockets.push(socket);
  return socket;
}

function Probe({ onSocket }: { onSocket: (value: ReturnType<typeof useSocket>) => void }) {
  onSocket(useSocket());
  return null;
}

function renderProvider() {
  const seen: { current: ReturnType<typeof useSocket> | null } = { current: null };
  render(
    <SocketProvider>
      <Probe onSocket={(value) => (seen.current = value)} />
    </SocketProvider>,
  );
  return seen;
}

describe("SocketProvider", () => {
  beforeEach(() => {
    chat.available = true;
    createdSockets.length = 0;
    ioMock.mockReset();
    ioMock.mockImplementation((_url: string, options: { auth: FakeSocket["auth"] }) =>
      fakeSocket(options),
    );
    useAuthStore.setState({ accessToken: null, user: null }, false);
  });

  it("does not connect while there is no access token", () => {
    const seen = renderProvider();
    expect(ioMock).not.toHaveBeenCalled();
    expect(seen.current?.socket).toBeNull();
  });

  it("connects once at mount and keeps the same socket across a token refresh (only auth is updated)", () => {
    useAuthStore.setState({ accessToken: "token-1" }, false);
    const seen = renderProvider();
    expect(ioMock).toHaveBeenCalledTimes(1);
    expect(tokenSentBy(createdSockets[0])).toBe("token-1");
    expect(createdSockets[0].connect).toHaveBeenCalledTimes(1);

    act(() => {
      useAuthStore.setState({ accessToken: "token-2" }, false);
    });

    // Refresh không ngắt kết nối; lần reconnect sau sẽ dùng token mới.
    expect(createdSockets[0].disconnect).not.toHaveBeenCalled();
    expect(ioMock).toHaveBeenCalledTimes(1);
    expect(tokenSentBy(createdSockets[0])).toBe("token-2");
    expect(seen.current?.socket).toBe(createdSockets[0]);
  });

  it("disconnects and drops the socket on logout", () => {
    useAuthStore.setState({ accessToken: "token-1" }, false);
    const seen = renderProvider();
    act(() => {
      useAuthStore.getState().clearAuth();
    });
    expect(createdSockets[0].disconnect).toHaveBeenCalled();
    expect(seen.current?.socket).toBeNull();
    expect(seen.current?.isConnected).toBe(false);
  });

  it("stays disconnected while the chat feature is unavailable", () => {
    chat.available = false;
    useAuthStore.setState({ accessToken: "token-1" }, false);
    renderProvider();
    expect(ioMock).not.toHaveBeenCalled();
  });
});
