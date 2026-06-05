import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizeServerReact: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
