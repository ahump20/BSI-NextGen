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
    ],
  },
  env: {
    SPORTSDATAIO_API_KEY: process.env.SPORTSDATAIO_API_KEY,
  },
}

module.exports = nextConfig
