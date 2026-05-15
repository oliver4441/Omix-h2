import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js where the project root is (avoids parent lockfile confusion)
  turbopack: {
    root: process.cwd(),
  },
  // Optimize builds for memory-constrained environments
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    // Use lightningcss for CSS handling instead of PostCSS (avoids Turbopack worker crash)
    useLightningcss: true,
  },
  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,
};

export default nextConfig;
