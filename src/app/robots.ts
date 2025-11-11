import { MetadataRoute } from 'next'

/**
 * Robots.txt configuration for search engine crawlers
 * Defines which pages can be crawled and indexed
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://qr-generator.botrixai.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/settings/',
          '/*?*utm_*',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/dashboard/settings/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/dashboard/settings/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
