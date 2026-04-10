import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Security headers for fintech application
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: (() => {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
              const wsUrl = apiUrl.replace(/^http/, "ws");
              return `
                default-src 'self';
                script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
                style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                img-src 'self' blob: data: https:;
                font-src 'self' data: https://fonts.gstatic.com;
                connect-src 'self' ${apiUrl} ${wsUrl} https://vercel.live;
                frame-src 'self';
                object-src 'none';
                base-uri 'self';
                form-action 'self';
                frame-ancestors 'self';
                upgrade-insecure-requests;
              `
                .replace(/\s{2,}/g, " ")
                .trim();
            })(),
          },
        ],
      },
    ];
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "Smipay",
    /** Comma-separated admin emails; DEV_EMAILS in .env is mapped here for client-side dev UI. */
    NEXT_PUBLIC_DEV_EMAILS:
      process.env.DEV_EMAILS ?? process.env.NEXT_PUBLIC_DEV_EMAILS ?? "",
  },
};

export default nextConfig;
