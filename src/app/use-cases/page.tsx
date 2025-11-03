/**
 * Use Cases Page
 * Showcases different use cases for QR codes
 */

import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ShoppingCart,
  Calendar,
  FileText,
  Wifi,
  Users,
  CreditCard,
  Gift,
  MapPin,
  Smartphone,
  Mail,
  Music,
  Camera,
} from 'lucide-react'
import Link from 'next/link'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Use Cases - QR Code Applications',
  description: 'Discover how QR codes can be used in marketing, payments, events, retail, and more.',
  url: '/use-cases',
  keywords: ['QR code use cases', 'QR code applications', 'QR marketing', 'QR payments'],
})

const useCases = [
  {
    icon: ShoppingCart,
    title: 'Retail & E-commerce',
    description: 'Enable quick product information, easy checkout, and seamless shopping experiences.',
    examples: ['Product details', 'Quick checkout', 'Inventory tracking', 'Loyalty programs'],
  },
  {
    icon: Calendar,
    title: 'Events & Tickets',
    description: 'Streamline event check-ins, share event details, and manage attendee access.',
    examples: ['Event tickets', 'Check-in systems', 'Event information', 'Networking'],
  },
  {
    icon: FileText,
    title: 'Business Cards',
    description: 'Create digital business cards that instantly share contact information and social profiles.',
    examples: ['Contact sharing', 'vCard generation', 'Social links', 'Portfolio links'],
  },
  {
    icon: Wifi,
    title: 'WiFi Access',
    description: 'Allow guests to connect to WiFi without typing long passwords.',
    examples: ['Guest WiFi', 'Public networks', 'Event WiFi', 'Hotspot sharing'],
  },
  {
    icon: Users,
    title: 'Marketing & Campaigns',
    description: 'Track campaigns, measure engagement, and connect offline to online marketing.',
    examples: ['Print advertising', 'Billboards', 'Flyers', 'Promotional materials'],
  },
  {
    icon: CreditCard,
    title: 'Payments',
    description: 'Accept payments via UPI, digital wallets, and payment links.',
    examples: ['UPI payments', 'Payment links', 'Donations', 'Quick checkout'],
  },
  {
    icon: Gift,
    title: 'Coupons & Promotions',
    description: 'Distribute discount codes, special offers, and promotional content instantly.',
    examples: ['Discount codes', 'Special offers', 'Gift cards', 'Loyalty rewards'],
  },
  {
    icon: MapPin,
    title: 'Location Sharing',
    description: 'Share locations, directions, and place information easily.',
    examples: ['Location links', 'Directions', 'Venue information', 'Check-ins'],
  },
  {
    icon: Smartphone,
    title: 'App Downloads',
    description: 'Drive app installs with QR codes linking to app stores.',
    examples: ['App store links', 'Deep links', 'Progressive web apps', 'Mobile installs'],
  },
  {
    icon: Mail,
    title: 'Contact & Email',
    description: 'Share email addresses, contact forms, and communication channels.',
    examples: ['Email links', 'Contact forms', 'Newsletter signup', 'Feedback forms'],
  },
  {
    icon: Music,
    title: 'Media & Content',
    description: 'Share audio, video, playlists, and multimedia content instantly.',
    examples: ['Music links', 'Video sharing', 'Playlists', 'Podcasts'],
  },
  {
    icon: Camera,
    title: 'Social Media',
    description: 'Connect to social profiles, posts, and social media campaigns.',
    examples: ['Profile links', 'Post sharing', 'Social campaigns', 'Influencer marketing'],
  },
]

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            QR Codes for{' '}
            <span className="text-primary">Every Industry</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover how businesses use QR codes to enhance customer experiences and streamline operations.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>{useCase.title}</CardTitle>
                  <CardDescription>{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {useCase.examples.map((example, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Find Your Use Case?</h2>
              <p className="text-muted-foreground mb-6">
                Start creating QR codes for your business today.
              </p>
              <Link href="/auth/signup">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                  Get Started Free
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

