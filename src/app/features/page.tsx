/**
 * Features Page
 * Showcases all platform features
 */

import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  QrCode,
  Palette,
  BarChart3,
  Download,
  Zap,
  Globe,
  Shield,
  Workflow,
  Sparkles,
  Layers,
  Smartphone,
  Link2,
} from 'lucide-react'
import Link from 'next/link'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Features - Advanced QR Code Customization',
  description: 'Discover powerful QR code features: customization, analytics, dynamic QR codes, custom domains, API access, and more.',
  url: '/features',
  keywords: ['QR code features', 'QR customization', 'QR analytics', 'dynamic QR codes'],
})

const features = [
  {
    icon: QrCode,
    title: 'Advanced QR Codes',
    description: 'Create QR codes with custom colors, patterns, logos, and styling options.',
    category: 'Core',
  },
  {
    icon: Palette,
    title: 'Professional Design',
    description: 'Choose from templates, customize gradients, add logos, and create branded QR codes.',
    category: 'Design',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track scans, locations, devices, and engagement metrics for all your QR codes.',
    category: 'Analytics',
  },
  {
    icon: Workflow,
    title: 'Dynamic QR Codes',
    description: 'Update QR code destinations without reprinting. Change URLs on the fly.',
    category: 'Core',
  },
  {
    icon: Globe,
    title: 'Custom Domains',
    description: 'Use your own domain for QR codes with vanity URLs and custom branding.',
    category: 'Branding',
  },
  {
    icon: Zap,
    title: 'Bulk Generation',
    description: 'Generate hundreds of QR codes at once with our bulk creation tools.',
    category: 'Productivity',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Row-level security, API keys, audit logs, and compliance features.',
    category: 'Security',
  },
  {
    icon: Link2,
    title: 'API Access',
    description: 'Integrate QR code generation into your applications with our REST API.',
    category: 'Developer',
  },
  {
    icon: Smartphone,
    title: 'Mobile Optimized',
    description: 'QR codes that work seamlessly on all devices and screen sizes.',
    category: 'Core',
  },
  {
    icon: Download,
    title: 'Multiple Formats',
    description: 'Download QR codes as PNG, SVG, or PDF for any use case.',
    category: 'Core',
  },
  {
    icon: Sparkles,
    title: 'Visual Effects',
    description: 'Add gradients, patterns, rounded corners, and custom shapes.',
    category: 'Design',
  },
  {
    icon: Layers,
    title: 'White Label',
    description: 'Remove watermarks and create fully branded QR code experiences.',
    category: 'Branding',
  },
]


export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Powerful Features for{' '}
            <span className="text-primary">Every Use Case</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create, customize, and manage professional QR codes at scale.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Icon className="h-8 w-8 text-primary" />
                    <Badge variant="outline">{feature.category}</Badge>
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6">
                Create your first QR code in seconds. No credit card required.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/auth/signup">
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                    Start Free Trial
                  </button>
                </Link>
                <Link href="/pricing">
                  <button className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition-colors">
                    View Pricing
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

