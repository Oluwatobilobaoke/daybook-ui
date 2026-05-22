import type { NextConfig } from "next";

const BACKEND =
  process.env.BACKEND_INTERNAL_URL?.replace(/\/+$/, "") ||
  "http://localhost:8376";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND}/api/:path*` }];
  },
};

export default nextConfig;
