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
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.1.129"],
};

export default nextConfig;
