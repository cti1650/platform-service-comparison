import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3はnative moduleのためserver-onlyで使用
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
