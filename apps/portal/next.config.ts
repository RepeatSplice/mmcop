import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  webpack(config) {
    // Remap @prisma/client to the portal's isolated generated client so that
    // workspace hoisting of the root mmcop @prisma/client is bypassed.
    config.resolve.alias["@prisma/client"] = path.resolve(
      __dirname,
      "node_modules/.prisma/portal-client"
    );
    return config;
  },
};

export default nextConfig;
