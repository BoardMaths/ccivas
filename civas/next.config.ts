import type { NextConfig } from "next";
import { resolve } from "node:path";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  }, pnpm-lock.yaml
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactCompiler: true,
  // @ts-ignore - turbopack.root is required to silence the workspace root warning
  turbopack: {
    root: resolve("."),
  },

  // ── Security headers for all routes ────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // ── Prevent source-maps in production ──────────────────────────────
  productionBrowserSourceMaps: false,

  // ── Limit server-side external packages to allowlist ───────────────
  serverExternalPackages: ["pg", "bcryptjs", "nodemailer"],
};

export default nextConfig;
