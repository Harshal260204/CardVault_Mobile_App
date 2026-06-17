/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * External resources audit (WEB):
 * - API: same-origin BFF (/api/proxy, /api/auth/*); optional legacy Nest origin from NEXT_PUBLIC_API_URL
 * - Fonts: self-hosted via next/font (no fonts.googleapis.com / fonts.gstatic.com)
 * - Stripe: hosted checkout redirect only (no Stripe.js embed) — no third-party script CDN
 * - Sentry: not loaded in WEB
 * - Framer Motion / Tailwind: bundled; inline styles need style-src 'unsafe-inline'
 * - Next.js: inline scripts in dev; use 'unsafe-eval' in development only
 */
function buildContentSecurityPolicy() {
  const connectSrc = ["'self'"];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const normalized = apiUrl.replace(/\/api\/v1\/?$/, '');
      connectSrc.push(new URL(normalized).origin);
    } catch {
      // ignore invalid env
    }
  }

  const scriptSrc = isProduction
    ? ["'self'", "'unsafe-inline'"]
    : ["'self'", "'unsafe-inline'", "'unsafe-eval'"];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    // Future Stripe.js embed: add https://js.stripe.com https://checkout.stripe.com to script-src/frame-src
    // Future Sentry: add https://*.ingest.sentry.io to connect-src
  ].join('; ');
}

function buildSecurityHeaders() {
  const headers = [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
    },
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy() },
  ];

  if (isProduction) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  }

  return headers;
}

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: buildSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;
