/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {},
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
