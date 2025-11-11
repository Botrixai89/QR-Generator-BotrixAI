/**
 * Structured Data Component for SEO
 * Provides JSON-LD schemas for rich snippets in search results
 */

interface StructuredDataProps {
  type: 'website' | 'software' | 'howto' | 'faq' | 'breadcrumb'
  data?: Record<string, unknown>
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const getSchema = () => {
    const baseUrl = 'https://qr-generator.botrixai.com'

    switch (type) {
      case 'website':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'BotrixAI QR Generator',
          alternateName: ['BotrixAI QR Code Generator', 'qr generator botrix ai', 'botrix ai qr generator'],
          url: baseUrl,
          description: 'BotrixAI QR Generator - Create stunning, customizable QR codes instantly with logos, colors, and analytics tracking. Free QR code generator by BotrixAI.',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${baseUrl}?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
          author: {
            '@type': 'Organization',
            name: 'BotrixAI',
            url: baseUrl,
          },
        }

      case 'software':
        return {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'BotrixAI QR Code Generator',
          alternateName: ['qr generator botrix ai', 'botrix ai qr generator', 'BotrixAI QR Generator'],
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Web Browser, Windows, macOS, Linux, iOS, Android',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '1250',
            bestRating: '5',
            worstRating: '1',
          },
          featureList: [
            'Free QR Code Generation',
            'Custom Logo Upload',
            'Color Customization',
            'Multiple Templates',
            'Analytics Tracking',
            'Multiple Export Formats (PNG, SVG)',
            'Dynamic QR Codes',
            'Batch QR Code Generation',
            'API Access',
            'Real-time Preview',
          ],
          screenshot: `${baseUrl}/screenshot.png`,
          softwareVersion: '1.0',
          applicationSubCategory: 'QR Code Generator',
          browserRequirements: 'Requires JavaScript. Requires HTML5.',
          creator: {
            '@type': 'Organization',
            name: 'BotrixAI',
            url: baseUrl,
          },
          description: 'Professional QR code generator with advanced customization options including logos, colors, templates, and analytics tracking',
          downloadUrl: baseUrl,
          releaseNotes: 'Feature-rich QR code generation with enterprise-grade capabilities',
          softwareHelp: {
            '@type': 'CreativeWork',
            url: `${baseUrl}/help`,
          },
        }

      case 'howto':
        return {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to Create a Custom QR Code with Logo',
          description: 'Step-by-step guide to creating beautiful, customized QR codes with your brand logo',
          image: `${baseUrl}/tutorial-image.png`,
          totalTime: 'PT2M',
          estimatedCost: {
            '@type': 'MonetaryAmount',
            currency: 'USD',
            value: '0',
          },
          tool: {
            '@type': 'HowToTool',
            name: 'BotrixAI QR Generator',
          },
          step: [
            {
              '@type': 'HowToStep',
              name: 'Enter Your URL or Text',
              text: 'Type or paste the URL, text, or UPI ID you want to encode in your QR code',
              position: 1,
              image: `${baseUrl}/step1.png`,
            },
            {
              '@type': 'HowToStep',
              name: 'Customize Colors and Style',
              text: 'Choose your preferred colors, dot styles, and corner styles to match your brand',
              position: 2,
              image: `${baseUrl}/step2.png`,
            },
            {
              '@type': 'HowToStep',
              name: 'Upload Your Logo',
              text: 'Upload your company logo or brand image to embed in the center of the QR code',
              position: 3,
              image: `${baseUrl}/step3.png`,
            },
            {
              '@type': 'HowToStep',
              name: 'Generate and Download',
              text: 'Click generate to create your QR code and download it in PNG or SVG format',
              position: 4,
              image: `${baseUrl}/step4.png`,
            },
          ],
        }

      case 'faq':
        return {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Is the QR code generator free to use?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes! BotrixAI QR Generator is completely free for basic features. You can create unlimited QR codes with custom colors, logos, and download them in multiple formats at no cost.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can I add my logo to the QR code?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Absolutely! You can upload your company logo or any image and embed it in the center of your QR code. The generator automatically optimizes the logo placement to maintain QR code scannability.',
              },
            },
            {
              '@type': 'Question',
              name: 'What formats can I download QR codes in?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'You can download your QR codes in PNG format for web and print use, or SVG format for scalable vector graphics. Both formats maintain high quality and are suitable for professional use.',
              },
            },
            {
              '@type': 'Question',
              name: 'Do QR codes expire?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Static QR codes generated with BotrixAI never expire. Once created, they will work forever. For dynamic QR codes with tracking capabilities, they remain active as long as your account is active.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can I track QR code scans?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes! When you create an account, you get access to our analytics dashboard where you can track scans, geographic location, device types, and scan times for all your QR codes.',
              },
            },
            {
              '@type': 'Question',
              name: 'What can I encode in a QR code?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'You can encode URLs, website links, plain text, contact information (vCard), WiFi credentials, UPI payment IDs, email addresses, phone numbers, SMS messages, and much more.',
              },
            },
          ],
        }

      case 'breadcrumb':
        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: data?.items || [],
        }

      default:
        return null
    }
  }

  const schema = getSchema()

  if (!schema) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Organization Schema
export function OrganizationSchema() {
  const baseUrl = 'https://qr-generator.botrixai.com'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BotrixAI',
    alternateName: 'BotrixAI QR Generator',
    url: baseUrl,
    logo: `${baseUrl}/botrix-logo01.png`,
    description: 'Professional QR code generation platform with advanced customization and analytics',
    sameAs: [
      // Add your social media URLs here
      'https://twitter.com/BotrixAI',
      'https://facebook.com/BotrixAI',
      'https://linkedin.com/company/botrixai',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@botrixai.com',
      availableLanguage: ['English'],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

