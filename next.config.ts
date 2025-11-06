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
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },
  // Build optimizations
  compiler: {
    // Remove console logs in production for smaller bundle
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Webpack configuration for code splitting and build performance
  webpack: (config, { isServer, dev }) => {
    // Optimize build performance
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        // Use faster minification
        minimize: true,
        // Better code splitting
        splitChunks: {
          ...config.optimization?.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            default: false,
            vendors: false,
            // Separate vendor chunks for better caching
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module: { context: string }) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
                return packageName ? `npm.${packageName.replace('@', '')}` : null;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Split large QR libraries into separate chunks
            qrLibraries: {
              test: /[\\/]node_modules[\\/](qr-code-styling|qrcode|qr-scanner|jsqr)[\\/]/,
              name: 'qr-libraries',
              chunks: 'async',
              priority: 20,
            },
            // Split Radix UI components
            radixUI: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              chunks: 'async',
              priority: 15,
            },
          },
        },
      };
    }

    if (!isServer) {
      // Client-side optimizations
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
  // Exclude unnecessary files from build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
