/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
  outputFileTracingIncludes: {
    "/**/*": ["./generated/prisma/**", "./generated/prisma/.prisma/**", "./node_modules/.prisma/**"],
  },
  webpack: (config, { isServer }) => {
    // Fix for Prisma node:crypto imports
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
