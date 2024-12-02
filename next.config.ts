import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: false,
  },
  webpack: (config, { isServer }) => {
    // This is a browser-only package
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
  compiler: {
    reactRemoveProperties: process.env.NODE_ENV === 'production'
  }
};

export default nextConfig;
