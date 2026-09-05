import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_API_URL ||
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8085";

console.log(
  "KemKendra frontend backend URL:",
  backendUrl
);
const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kemkendra.com",
      },
      {
        protocol: "https",
        hostname: "*.kemkendra.com",
      },
      ...(process.env.NODE_ENV !== "production"
        ? [
            {
              protocol: "http" as const,
              hostname: "localhost",
            },
            {
              protocol: "http" as const,
              hostname: "127.0.0.1",
            },
          ]
        : []),
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    // SECURITY B1: In production, strictly prohibit 'unsafe-eval' to eliminate dynamic script execution sinks.
    // In local development only, 'unsafe-eval' is permitted for React/Turbopack source map hydration.
    const scriptSrc = isProd
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

    const connectSrc = isProd
      ? "connect-src 'self' https:"
      : "connect-src 'self' http://localhost:* http://127.0.0.1:* https:";

    const cspHeader = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      connectSrc,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "frame-src 'self'",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
    ].join("; ");

    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: cspHeader,
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=()",
      },
      ...(isProd
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=31536000; includeSubDomains; preload",
            },
          ]
        : []),
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|ico|webmanifest|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;