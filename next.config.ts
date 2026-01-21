import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.webp': ['file'],
    },
  },
  experimental: {
    serverSourceMaps: false,
    ppr: false,
  },
  productionBrowserSourceMaps: false, // Enable source maps
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Remove webpack config since we're using Turbopack
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //       path: false,
  //     };
  //   }
  //   return config;
  // },
};

export default nextConfig;
