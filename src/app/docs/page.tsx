/**
 * Documentation Page
 * Documentation hub and getting started guide
 */

import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Book,
  Code,
  Key,
  Webhook,
  Zap,
  FileText,
  Settings,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Documentation - API Docs & Guides',
  description: 'Complete documentation for QR Generator API, integration guides, and developer resources.',
  url: '/docs',
  keywords: ['QR Generator API', 'API documentation', 'developer docs', 'QR API'],
})

const docsSections = [
  {
    icon: Zap,
    title: 'Getting Started',
    description: 'Quick start guides and tutorials',
    links: [
      { name: 'Introduction', href: '/docs/getting-started' },
      { name: 'Quick Start', href: '/docs/quick-start' },
      { name: 'Authentication', href: '/docs/authentication' },
    ],
  },
  {
    icon: Code,
    title: 'API Reference',
    description: 'Complete API documentation',
    links: [
      { name: 'REST API', href: '/docs/api/rest' },
      { name: 'Webhooks', href: '/docs/api/webhooks' },
      { name: 'Rate Limits', href: '/docs/api/rate-limits' },
    ],
  },
  {
    icon: Key,
    title: 'API Keys',
    description: 'Manage and secure API keys',
    links: [
      { name: 'Creating API Keys', href: '/docs/api-keys/create' },
      { name: 'Scopes & Permissions', href: '/docs/api-keys/scopes' },
      { name: 'Security Best Practices', href: '/docs/api-keys/security' },
    ],
  },
  {
    icon: Webhook,
    title: 'Webhooks',
    description: 'Real-time event notifications',
    links: [
      { name: 'Webhook Setup', href: '/docs/webhooks/setup' },
      { name: 'Event Types', href: '/docs/webhooks/events' },
      { name: 'Webhook Security', href: '/docs/webhooks/security' },
    ],
  },
  {
    icon: Settings,
    title: 'Integrations',
    description: 'Third-party integrations and SDKs',
    links: [
      { name: 'JavaScript SDK', href: '/docs/integrations/js' },
      { name: 'Python SDK', href: '/docs/integrations/python' },
      { name: 'Webhooks Guide', href: '/docs/integrations/webhooks' },
    ],
  },
  {
    icon: FileText,
    title: 'Guides',
    description: 'Step-by-step tutorials',
    links: [
      { name: 'Creating QR Codes', href: '/docs/guides/creating-qr-codes' },
      { name: 'Custom Domains', href: '/docs/guides/custom-domains' },
      { name: 'Analytics Setup', href: '/docs/guides/analytics' },
    ],
  },
  {
    icon: HelpCircle,
    title: 'Support',
    description: 'Get help and support',
    links: [
      { name: 'FAQ', href: '/docs/support/faq' },
      { name: 'Troubleshooting', href: '/docs/support/troubleshooting' },
      { name: 'Contact Support', href: '/docs/support/contact' },
    ],
  },
  {
    icon: Book,
    title: 'Resources',
    description: 'Additional resources and tools',
    links: [
      { name: 'Changelog', href: '/changelog' },
      { name: 'Blog', href: '/blog' },
      { name: 'API Playground', href: '/dashboard/developers' },
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Documentation & <span className="text-primary">Developer Resources</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to integrate QR Generator into your applications.
          </p>
        </div>

        {/* Documentation Sections */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {docsSections.map((section, index) => {
            const Icon = section.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.links.map((link, i) => (
                      <li key={i}>
                        <Link
                          href={link.href}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {link.name}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Links */}
        <Card className="bg-primary/5 border-primary/20 mb-12">
          <CardHeader>
            <CardTitle>Popular Resources</CardTitle>
            <CardDescription>Most commonly accessed documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Link
                href="/dashboard/developers"
                className="p-4 bg-background rounded-lg hover:bg-muted transition-colors"
              >
                <div className="font-semibold mb-1">API Playground</div>
                <div className="text-sm text-muted-foreground">
                  Test API endpoints interactively
                </div>
              </Link>
              <Link
                href="/docs/api/rest"
                className="p-4 bg-background rounded-lg hover:bg-muted transition-colors"
              >
                <div className="font-semibold mb-1">REST API Reference</div>
                <div className="text-sm text-muted-foreground">
                  Complete API documentation
                </div>
              </Link>
              <Link
                href="/docs/getting-started"
                className="p-4 bg-background rounded-lg hover:bg-muted transition-colors"
              >
                <div className="font-semibold mb-1">Getting Started</div>
                <div className="text-sm text-muted-foreground">
                  Quick start guide
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Card className="bg-background border-border max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Ready to Build?</h2>
              <p className="text-muted-foreground mb-6">
                Get started with our API or explore the dashboard.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/auth/signup">
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                    Start Building
                  </button>
                </Link>
                <Link href="/dashboard/developers">
                  <button className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition-colors">
                    View API Playground
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

