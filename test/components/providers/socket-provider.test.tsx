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
  auth: { token: string };
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

const createdSockets: FakeSocket[] = [];

function fakeSocket(options: { auth: { token: string } }): FakeSocket {
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
    ioMock.mockImplementation((_url: string, options: { auth: { token: string } }) =>
      fakeSocket(options),
    );
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null }, false);
  });

  it("does not connect while there is no access token", () => {
    const seen = renderProvider();
    expect(ioMock).not.toHaveBeenCalled();
    expect(seen.current?.socket).toBeNull();
  });

  it("connects with the token present at mount and reconnects with the new token after a token change", () => {
    useAuthStore.setState({ accessToken: "token-1" }, false);
    const seen = renderProvider();
    expect(ioMock).toHaveBeenCalledTimes(1);
    expect(createdSockets[0].auth.token).toBe("token-1");
    expect(createdSockets[0].connect).toHaveBeenCalledTimes(1);

    act(() => {
      useAuthStore.setState({ accessToken: "token-2" }, false);
    });

    expect(createdSockets[0].disconnect).toHaveBeenCalled();
    expect(ioMock).toHaveBeenCalledTimes(2);
    expect(createdSockets[1].auth.token).toBe("token-2");
    expect(seen.current?.socket).toBe(createdSockets[1]);
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
