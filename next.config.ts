import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['razorpay'],
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Security: Remove X-Powered-By header
  poweredByHeader: false,
  // Compress responses
  compress: true,
  // Security headers are handled in middleware
  // Code splitting and optimization
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Webpack configuration for code splitting
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Split large QR libraries into separate chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            qrLibraries: {
              test: /[\\/]node_modules[\\/](qr-code-styling|qrcode)[\\/]/,
              name: 'qr-libraries',
              chunks: 'async',
              priority: 10,
            },
          },
        },
      }
    }
    return config
  },
};

export default nextConfig;
