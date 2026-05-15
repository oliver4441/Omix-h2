import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js where the project root is (avoids parent lockfile confusion)
  turbopack: {
    root: process.cwd(),
  },
  // Reduce build memory on constrained environments (Render free tier)
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  // Disable source maps in production to reduce build memory
  productionBrowserSourceMaps: false,
};

export default nextConfig;
