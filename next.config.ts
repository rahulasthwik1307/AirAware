import type { NextConfig } from 'next';

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://server.arcgisonline.com https://tiles.openfreemap.org https://*.openfreemap.org",
  "font-src 'self' data: https://fonts.gstatic.com https://tiles.openfreemap.org",
  "connect-src 'self' https://air-quality-api.open-meteo.com https://api.open-meteo.com https://geocoding-api.open-meteo.com https://api.openaq.org https://api.cloudflare.com https://server.arcgisonline.com https://tiles.openfreemap.org https://*.openfreemap.org",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), camera=(), microphone=(), payment=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: cspDirectives,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
