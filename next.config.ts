import type { NextConfig } from "next";
import path from "path";

const appRoot = path.resolve(__dirname);
const isDev = process.env.NODE_ENV !== "production";

// Browser talks to Supabase directly (auth, storage), so allow it for fetch/websocket/images.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";
const supabaseWs = supabaseOrigin.replace(/^http/, "ws");

// Next.js injects inline hydration scripts, so 'unsafe-inline' is needed without a
// nonce setup. The policy still blocks third-party scripts, plugins, framing,
// <base> hijacking and form posts to other sites.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs}${isDev ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`.trim(),
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

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
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Never let browsers or proxies store API responses (personal data).
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
