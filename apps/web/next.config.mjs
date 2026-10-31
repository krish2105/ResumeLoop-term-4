const api = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8014';
const dev = process.env.NODE_ENV !== 'production';

// Next inlines its bootstrap scripts, so script-src needs 'unsafe-inline' without a nonce setup.
// The 3D labels (troika) fetch glyph data from jsDelivr and build their worker from a blob.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' blob:${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  `connect-src 'self' ${api} https://cdn.jsdelivr.net${dev ? ' ws:' : ''}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets the demo build use its own folder while the dev server uses .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // The Docker image ships only the traced server files (NEXT_OUTPUT=standalone); Vercel and CI build normally.
  ...(process.env.NEXT_OUTPUT === 'standalone' ? {output: 'standalone'} : {}),
  poweredByHeader: false,
  async headers() {
    return [{source: '/:path*', headers: [
      {key: 'Content-Security-Policy', value: csp},
      {key: 'X-Content-Type-Options', value: 'nosniff'},
      {key: 'X-Frame-Options', value: 'DENY'},
      {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
      {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()'},
      {key: 'Cross-Origin-Opener-Policy', value: 'same-origin'},
    ]}];
  },
};

export default nextConfig;
