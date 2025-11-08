/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
