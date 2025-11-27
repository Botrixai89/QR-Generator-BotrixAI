/**
 * Changelog Page
 * Displays product updates and version history
 */

import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Sparkles, Bug, Zap } from 'lucide-react'
import Link from 'next/link'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Changelog - Product Updates',
  description: 'Stay updated with the latest features, improvements, and fixes to QR Generator.',
  url: '/changelog',
  keywords: ['QR Generator updates', 'product changelog', 'feature updates'],
})

interface ChangelogEntry {
  version: string
  date: string
  type: 'feature' | 'improvement' | 'fix'
  title: string
  description: string
  items: string[]
}

const changelog: ChangelogEntry[] = [
  {
    version: '2.0.0',
    date: '2025-01-08',
    type: 'feature',
    title: 'Major Release: Observability & Marketing',
    description: 'Added comprehensive observability, marketing site, and growth features.',
    items: [
      'Centralized logging with correlation IDs and PII masking',
      'Sentry error tracking integration',
      'Web Vitals performance monitoring',
      'Admin System Health dashboard',
      'Marketing pages: features, use-cases, changelog',
      'SEO optimization with sitemaps and robots.txt',
      'Self-serve refunds and cancellation surveys',
      'Referral program and affiliate tracking',
    ],
  },
  {
    version: '1.5.0',
    date: '2025-01-07',
    type: 'feature',
    title: 'Performance & Reliability Enhancements',
    description: 'Improved system reliability and performance.',
    items: [
      'Background job queue system',
      'Webhook outbox pattern for guaranteed delivery',
      'Circuit breaker pattern implementation',
      'Retry logic with exponential backoff',
      'Edge caching for public endpoints',
    ],
  },
  {
    version: '1.4.0',
    date: '2025-01-06',
    type: 'feature',
    title: 'Brand Kit & Internationalization',
    description: 'Added brand kit management and i18n support.',
    items: [
      'Organization brand kit management',
      'Multi-language translation support',
      'Custom QR style presets',
      'Brand color management',
    ],
  },
  {
    version: '1.3.0',
    date: '2025-01-05',
    type: 'feature',
    title: 'Custom Domains & Vanity URLs',
    description: 'Full custom domain support with DNS verification.',
    items: [
      'Custom domain management',
      'DNS verification with TXT records',
      'Auto SSL certificate management',
      'Vanity URL support',
      'Custom error pages',
    ],
  },
  {
    version: '1.2.0',
    date: '2025-01-04',
    type: 'feature',
    title: 'Email & Notifications',
    description: 'Comprehensive email and notification system.',
    items: [
      'Multi-provider email support (Resend, SendGrid, SES, SMTP)',
      'Email queue system',
      'In-app notifications',
      'Email templates',
      'Notification preferences',
    ],
  },
  {
    version: '1.1.0',
    date: '2025-01-03',
    type: 'feature',
    title: 'Security & Audit Logging',
    description: 'Enhanced security features and audit trails.',
    items: [
      'Comprehensive audit logging',
      'GDPR data export',
      'Account deletion',
      'Security headers',
      'CSRF protection',
    ],
  },
  {
    version: '1.0.0',
    date: '2025-01-01',
    type: 'feature',
    title: 'Initial Release',
    description: 'Launch of QR Generator platform.',
    items: [
      'QR code generation with customization',
      'User authentication',
      'Analytics dashboard',
      'Payment integration (Razorpay)',
      'API access',
    ],
  },
]

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'feature':
      return Sparkles
    case 'improvement':
      return Zap
    case 'fix':
      return Bug
    default:
      return Zap
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'feature':
      return 'bg-blue-500'
    case 'improvement':
      return 'bg-green-500'
    case 'fix':
      return 'bg-yellow-500'
    default:
      return 'bg-gray-500'
  }
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Product <span className="text-primary">Changelog</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Stay updated with the latest features, improvements, and fixes.
          </p>
        </div>

        {/* Changelog Entries */}
        <div className="space-y-8">
          {changelog.map((entry, index) => {
            const Icon = getTypeIcon(entry.type)
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-6 w-6 ${getTypeColor(entry.type)}`} />
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {entry.title}
                          <Badge variant="outline" className="ml-2">
                            v{entry.version}
                          </Badge>
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={getTypeColor(entry.type)}
                      variant="default"
                    >
                      {entry.type}
                    </Badge>
                  </div>
                  <CardDescription className="text-base">
                    {entry.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {entry.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className={`w-1.5 h-1.5 rounded-full ${getTypeColor(entry.type)} mt-2 flex-shrink-0`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Want to Stay Updated?</h2>
              <p className="text-muted-foreground mb-6">
                Sign up to receive notifications about new features and updates.
              </p>
              <Link href="/auth/signup">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                  Sign Up Free
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

