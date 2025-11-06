/**
 * SEO Utilities
 * Helper functions for generating SEO metadata
 */

import { Metadata } from 'next'

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  noIndex?: boolean
}

/**
 * Generate SEO metadata from config
 */
export function generateSEOMetadata(config: SEOConfig): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const fullUrl = config.url ? `${baseUrl}${config.url}` : baseUrl
  const imageUrl = config.image
    ? config.image.startsWith('http')
      ? config.image
      : `${baseUrl}${config.image}`
    : `${baseUrl}/og-image.png`

  const metadata: Metadata = {
    title: `${config.title} | QR Generator`,
    description: config.description,
    keywords: config.keywords || [
      'QR code',
      'QR code generator',
      'QR codes',
      'custom QR codes',
      'dynamic QR codes',
    ],
    openGraph: {
      title: config.title,
      description: config.description,
      url: fullUrl,
      siteName: 'QR Generator',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
      locale: 'en_US',
      type: config.type === 'product' ? 'website' : (config.type === 'article' ? 'article' : 'website'),
      ...(config.publishedTime && { publishedTime: config.publishedTime }),
      ...(config.modifiedTime && { modifiedTime: config.modifiedTime }),
      ...(config.author && { authors: [{ name: config.author }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      images: [imageUrl],
    },
    alternates: {
      canonical: fullUrl,
    },
    robots: {
      index: !config.noIndex,
      follow: !config.noIndex,
      googleBot: {
        index: !config.noIndex,
        follow: !config.noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }

  return metadata
}

/**
 * Default SEO metadata for pages
 */
export const defaultSEO: SEOConfig = {
  title: 'QR Generator - Create Beautiful QR Codes',
  description:
    'Generate and customize QR codes with logos, colors, and watermarks. Track your QR code usage with analytics.',
  keywords: [
    'QR code',
    'QR code generator',
    'custom QR codes',
    'dynamic QR codes',
    'QR analytics',
    'QR code customization',
  ],
}

