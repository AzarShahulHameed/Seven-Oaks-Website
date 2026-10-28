import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Local development: one shared .env at the repo root. On Vercel this file doesn't exist and the call is a harmless no-op.
loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

const API_URL = process.env.API_URL;

const csp = [
  "default-src 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://maps.googleapis.com" + (process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"),
  "connect-src 'self' https://api.cloudinary.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://www.facebook.com https://maps.googleapis.com",
  "frame-src 'self' https://www.google.com https://maps.google.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/** @type {import('next').NextConfig} */
export default {
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    // Browser talks to same-origin /api/*; Vercel proxies to the Render API (first-party cookies, no CORS).
    return API_URL ? [{ source: '/api/:path((?!revalidate).*)', destination: `${API_URL}/api/:path*` }] : [];
  },
  async headers() {
    return [
      {
        source: '/:path((?!preview).*)', // /preview has its own, frameable, rules below (two conflicting rules would be merged and block the frame)
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // The admin editor shows draft previews in a same-site frame.
      { source: '/preview', headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }, { key: 'Content-Security-Policy', value: csp.replace("frame-ancestors 'none'", "frame-ancestors 'self'") }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }] },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};
