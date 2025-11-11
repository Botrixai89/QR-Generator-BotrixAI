import { MetadataRoute } from 'next'

/**
 * Web App Manifest for PWA support and enhanced mobile experience
 * Improves mobile SEO and allows users to install the app
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BotrixAI QR Code Generator',
    short_name: 'BotrixAI QR',
    description: 'Create stunning, customizable QR codes with logos, colors, and analytics tracking',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['productivity', 'utilities', 'business'],
    screenshots: [
      {
        src: '/screenshot-mobile.png',
        sizes: '540x720',
        type: 'image/png',
        form_factor: 'narrow',
      },
      {
        src: '/screenshot-desktop.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
      },
    ],
  }
}

