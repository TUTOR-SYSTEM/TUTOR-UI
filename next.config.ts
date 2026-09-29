import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // bun workspace: node_modules của TUTOR-UI là symlink vào ../node_modules/.bun → root phải là workspace root,
  // nếu ghim về TUTOR-UI thì Turbopack không resolve được `next`. Tailwind được ghim base riêng ở postcss.config.mjs.
  turbopack: { root: path.resolve(__dirname, "..") },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "docs.google.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
};

export default nextConfig;
