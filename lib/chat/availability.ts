/**
 * Realtime/REST chat (`/chat/*` and the socket namespace `/chat`) is NOT served by the gateway:
 * gateway has no chat controller, and `ChatGateway` lives in tutor-service, which is not proxied.
 * Until gateway exposes it, the feature stays off: no chat requests, no socket connection.
 */
export const CHAT_AVAILABLE = false;
