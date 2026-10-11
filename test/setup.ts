import "@testing-library/jest-dom/vitest";

// Node may expose a bare `localStorage` global (without `clear`) that shadows jsdom's.
// Install an in-memory Storage only when the global is not a usable implementation.
if (typeof globalThis.localStorage?.clear !== "function") {
  const data = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return data.size;
    },
    key: (index) => Array.from(data.keys())[index] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, String(value));
    },
    removeItem: (key) => {
      data.delete(key);
    },
    clear: () => data.clear(),
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage,
    configurable: true,
    writable: true,
  });
}
