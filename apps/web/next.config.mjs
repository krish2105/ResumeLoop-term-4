/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets the demo build use its own folder while the dev server uses .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
