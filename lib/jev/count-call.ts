import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

// Cùng file với skill jev-router; statusline của Claude Code đọc `calls` từ đây.
const COUNT_FILE = join(homedir(), ".local/state/jev-router/count.json");

/** Tăng bộ đếm số lần gọi Jev. Chỉ ghi ở dev; mọi lỗi I/O bị bỏ qua. */
export function countJevCall(): void {
  if (process.env.NODE_ENV === "production") return;
  try {
    let n = 0;
    try {
      n = JSON.parse(readFileSync(COUNT_FILE, "utf8")).calls || 0;
    } catch {}
    mkdirSync(dirname(COUNT_FILE), { recursive: true });
    writeFileSync(COUNT_FILE, JSON.stringify({ calls: n + 1, updated: Date.now() }));
  } catch {}
}
