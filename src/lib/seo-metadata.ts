/**
 * SEO Metadata Helper Functions
 * Centralized metadata management for consistent SEO across all pages
 */

import { Metadata } from 'next'

const baseUrl = 'https://qr-generator.botrixai.com'
const siteName = 'BotrixAI QR Generator'

interface PageMetadata {
  title: string
  description: string
  keywords?: string[]
  path?: string
  image?: string
  noIndex?: boolean
}

/**
 * Generate comprehensive metadata for any page
 */
export function generateMetadata({
  title,
  description,
  keywords = [],
  path = '',
  image = '/og-image.png',
  noIndex = false,
}: PageMetadata): Metadata {
  const url = `${baseUrl}${path}`
  const fullTitle = `${title} | ${siteName}`

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  }
}

/**
 * Pre-configured metadata for common pages
 */
export const pageMetadata = {
  home: {
    title: 'Free QR Code Generator with Logo | Create Custom QR Codes Online',
    description:
      'Create stunning, customizable QR codes instantly with BotrixAI. Add logos, customize colors, track analytics & download in multiple formats. Perfect for business & marketing!',
    keywords: [
      'free qr code generator',
      'qr code maker',
      'custom qr code',
      'qr code with logo',
      'online qr generator',
    ],
  },
  signin: {
    title: 'Sign In to Your Account',
    description:
      'Sign in to BotrixAI QR Generator to access your dashboard, manage QR codes, and view analytics. Create and track unlimited custom QR codes.',
    keywords: ['sign in', 'login', 'qr code account'],
    noIndex: true,
  },
  signup: {
    title: 'Create Free Account',
    description:
      'Sign up for free to unlock advanced QR code features including logo upload, color customization, analytics tracking, and unlimited QR code generation.',
    keywords: ['sign up', 'register', 'create account', 'free qr code account'],
  },
  dashboard: {
    title: 'Dashboard - Manage Your QR Codes',
    description:
      'Access your QR code dashboard to create, edit, and manage all your QR codes. View detailed analytics, track scans, and download reports.',
    keywords: ['qr code dashboard', 'manage qr codes', 'qr analytics'],
    noIndex: true,
  },
  pricing: {
    title: 'Pricing Plans - Free & Premium QR Code Generator',
    description:
      'Choose the perfect plan for your needs. Start free with unlimited QR codes or upgrade to premium for advanced features, white-label options, and priority support.',
    keywords: [
      'qr code pricing',
      'free qr generator',
      'premium qr codes',
      'qr code plans',
    ],
  },
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbs(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  }
}

/**
 * Common SEO keywords for QR code industry
 */
export const commonKeywords = [
  'qr code',
  'qr generator',
  'barcode generator',
  'custom qr code',
  'free qr maker',
  'qr code design',
  'qr code creator',
  'generate qr code',
  'qr code online',
  'dynamic qr code',
  'qr code tracking',
  'qr code analytics',
  'branded qr code',
  'marketing qr code',
  'business qr code',
]

