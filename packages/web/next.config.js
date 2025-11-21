/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  modularizeImports: {
    '@react-three/drei': {
      transform: '@react-three/drei/{{member}}',
    },
    '@react-three/fiber': {
      transform: '@react-three/fiber/{{member}}',
    },
  },
  eslint: {
    // Temporarily ignore ESLint during builds
    // TODO: Fix linting issues in production code
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 604800,
    domains: [
      'www.mlbstatic.com',
      'a.espncdn.com',
      'loodibee.com',
    ],
  },
  env: {
    SPORTSDATAIO_API_KEY: process.env.SPORTSDATAIO_API_KEY,
  },
  experimental: {
    optimizePackageImports: ['@react-three/drei', '@react-three/fiber'],
  },
  async headers() {
    return [
      {
        // HTML pages: Short CDN cache to prevent stale content
        source: '/:path((?!_next|api).*)*',
        headers: [
          {
            key: 'Cache-Control',
            // Browser: always revalidate
            // CDN: cache for 60 seconds, then revalidate
            // Prevents 102-minute stale cache issues
            value: 'public, max-age=0, s-maxage=60, must-revalidate',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://statsapi.mlb.com https://api.sportsdata.io https://site.api.espn.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      {
        // Static assets: Long cache with immutable (versioned by Next.js)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            // 1 year cache - safe because Next.js versions these files
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
