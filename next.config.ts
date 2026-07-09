import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

// Security headers applied to all routes
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    // Prevent clickjacking
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Prevent MIME type sniffing
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Control referrer information
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Modern browsers use CSP instead; disable legacy XSS filter
    key: 'X-XSS-Protection',
    value: '0',
  },
  {
    // Disable unnecessary browser features
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    // HSTS — force HTTPS (only effective in production)
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // Basic Content Security Policy
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      `script-src 'self'${isDev ? " 'unsafe-eval'" : ''} 'unsafe-inline'`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' blob: data: https:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
