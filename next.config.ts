import type { NextConfig } from "next";
import path from "path";

const appRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  // Keep module resolution inside destiny-manifesto (parent folder has no package.json)
  turbopack: {
    root: appRoot,
    resolveAlias: {
      tailwindcss: path.join(appRoot, "node_modules/tailwindcss"),
    },
  },
  outputFileTracingRoot: appRoot,
};

export default nextConfig;
