/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
        port: "",
        pathname: "/**",
      },
    ],
  },
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["pg", "pg-pool"],
    optimizePackageImports: ["@radix-ui/react-icons"],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    config.optimization = {
      ...config.optimization,
      moduleIds: "deterministic",
      minimize: true,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      lib: require("path").resolve(__dirname, "./lib"),
    };
    return config;
  },
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
