const r2AssetBase = process.env.NEXT_PUBLIC_R2_ASSET_BASE_URL;
const r2Hostname = (() => {
  try {
    return r2AssetBase ? new URL(r2AssetBase).hostname : null;
  } catch (_error) {
    return null;
  }
})();

const cdnHeaders = [
  {
    key: 'Cache-Control',
    value: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400, immutable',
  },
  {
    key: 'CDN-Cache-Control',
    value: 'public, max-age=604800, stale-while-revalidate=604800',
  },
  {
    key: 'Timing-Allow-Origin',
    value: '*',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Temporarily ignore ESLint during builds
    // TODO: Fix linting issues in production code
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'www.mlbstatic.com',
      'a.espncdn.com',
      'loodibee.com',
      ...(r2Hostname ? [r2Hostname] : []),
    ],
  },
  assetPrefix: r2AssetBase || undefined,
  env: {
    SPORTSDATAIO_API_KEY: process.env.SPORTSDATAIO_API_KEY,
  },
  async rewrites() {
    if (!r2AssetBase) return [];
    return [
      {
        source: '/assets/:path*',
        destination: `${r2AssetBase}/:path*`,
      },
    ];
  },
  async headers() {
    const connectSrc = [
      "'self'",
      'https://statsapi.mlb.com',
      'https://api.sportsdata.io',
      'https://site.api.espn.com',
    ];

    if (r2AssetBase) {
      connectSrc.push(r2AssetBase);
    }

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
              `connect-src ${connectSrc.join(' ')}`,
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
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/assets/:path*',
        headers: cdnHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
