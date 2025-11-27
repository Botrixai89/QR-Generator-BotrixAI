/**
 * Blog Page
 * Lists blog posts and articles
 */

import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Blog - Tips, Tutorials & News',
  description: 'Learn about QR codes, best practices, tutorials, and industry news from QR Generator.',
  url: '/blog',
  type: 'website',
  keywords: ['QR code blog', 'QR tutorials', 'QR tips', 'QR marketing'],
})

interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readTime: string
  category: string
  featured?: boolean
}

const blogPosts: BlogPost[] = [
  {
    slug: 'getting-started-with-qr-codes',
    title: 'Getting Started with QR Codes: A Complete Guide',
    description: 'Learn everything you need to know about QR codes, from basics to advanced implementation strategies.',
    date: '2025-01-08',
    readTime: '5 min',
    category: 'Tutorial',
    featured: true,
  },
  {
    slug: 'best-practices-qr-code-design',
    title: 'Best Practices for QR Code Design',
    description: 'Discover design principles that make your QR codes both functional and visually appealing.',
    date: '2025-01-05',
    readTime: '8 min',
    category: 'Design',
    featured: true,
  },
  {
    slug: 'qr-codes-marketing-campaigns',
    title: 'Using QR Codes in Marketing Campaigns',
    description: 'Learn how to effectively integrate QR codes into your marketing strategy for better engagement.',
    date: '2025-01-03',
    readTime: '6 min',
    category: 'Marketing',
  },
  {
    slug: 'dynamic-vs-static-qr-codes',
    title: 'Dynamic vs Static QR Codes: Which Should You Use?',
    description: 'Understand the differences between dynamic and static QR codes and when to use each.',
    date: '2025-01-01',
    readTime: '4 min',
    category: 'Guide',
  },
]

export default function BlogPage() {
  const featuredPosts = blogPosts.filter(post => post.featured)
  const regularPosts = blogPosts.filter(post => !post.featured)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            QR Generator <span className="text-primary">Blog</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Tips, tutorials, and insights about QR codes and digital marketing.
          </p>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Featured Articles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Card key={post.slug} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <Link href={`/blog/${post.slug}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge>{post.category}</Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
                        </div>
                      </div>
                      <CardTitle className="text-xl">{post.title}</CardTitle>
                      <CardDescription>{post.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Posts */}
        <div>
          <h2 className="text-2xl font-bold mb-6">All Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Card key={post.slug} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href={`/blog/${post.slug}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{post.category}</Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {post.readTime}
                      </div>
                    </div>
                    <CardTitle>{post.title}</CardTitle>
                    <CardDescription>{post.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Card className="bg-primary/5 border-primary/20 max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
              <p className="text-muted-foreground mb-6">
                Get the latest articles and updates delivered to your inbox.
              </p>
              <Link href="/auth/signup">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                  Subscribe to Newsletter
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

