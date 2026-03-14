import type { NextConfig } from "next";

// Content-Security-Policy directives
// Kept as an array for readability, joined into a single header value below.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://raw.githubusercontent.com https://storage.googleapis.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.swapkit.dev https://api.frankfurter.dev https://eu.i.posthog.com https://eu-assets.i.posthog.com https://us.i.posthog.com https://verify.walletconnect.com https://explorer-api.walletconnect.com wss://relay.walletconnect.com wss://relay.walletconnect.org https://eth.merkle.io https://56.rpc.thirdweb.com https://arb1.arbitrum.io https://mainnet.base.org https://mainnet.optimism.io https://api.avax.network https://polygon-rpc.com https://rpc.gnosischain.com",
  "frame-src 'self' https://verify.walletconnect.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

const cspHeaderValue = cspDirectives.join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/trustwallet/assets/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/token-list-swapkit/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeaderValue,
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ]
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
