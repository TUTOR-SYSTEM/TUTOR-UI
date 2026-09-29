import path from "node:path";
import { fileURLToPath } from "node:url";

const config = {
  plugins: {
    // Ghim base về TUTOR-UI: nếu dev chạy từ workspace root (../), tailwind sẽ resolve
    // 'tailwindcss' tại ../ (không có) → "Can't resolve 'tailwindcss'".
    "@tailwindcss/postcss": {
      base: path.dirname(fileURLToPath(import.meta.url)),
    },
  },
};

export default config;
