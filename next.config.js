/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
    };
    return config;
  },
};

module.exports = nextConfig;
