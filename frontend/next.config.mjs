/**
 * Semua request ke /api/* diteruskan (proxy) ke backend Express.
 * Frontend & backend jadi satu origin: cookie login httpOnly aman dan tidak perlu CORS.
 * basePath configurable agar aplikasi tetap jalan di subfolder (SOP poin 3).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const backend = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
const apiPrefix = process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: `${apiPrefix}/:path*`, destination: `${backend}${apiPrefix}/:path*` }];
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};

export default nextConfig;
