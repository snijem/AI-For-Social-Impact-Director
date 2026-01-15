/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only use static export for production builds, not in development
  // API routes require server-side rendering, so we disable export in dev
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,
  // Only use basePath in production/export builds, not in development
  basePath: process.env.NODE_ENV === 'production' ? '/IPP-Project' : '',
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude server-only modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        path: false,
        util: false,
      }
    }
    return config
  },
}

module.exports = nextConfig

