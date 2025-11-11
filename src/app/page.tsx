"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import QRGenerator from "@/components/qr-generator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, BarChart3, Palette, Zap, Shield, Download } from "lucide-react"
import Link from "next/link"
import { StructuredData, OrganizationSchema } from "@/components/seo/structured-data"

export default function Home() {
  const { data: session, status } = useSession()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <>
        {/* SEO Structured Data */}
        <StructuredData type="website" />
        <StructuredData type="software" />
        <StructuredData type="howto" />
        <StructuredData type="faq" />
        <OrganizationSchema />

        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          <div className="container mx-auto px-4 py-12 md:py-16">
            {/* Hero Section - Simplified */}
            <header className="text-center mb-12 md:mb-16">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="text-primary">BotrixAI</span> QR Generator - Free QR Code Generator with Logo & Analytics
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
                Create stunning, customizable QR codes with BotrixAI QR Generator. Add logos, customize colors, track analytics, and download in multiple formats—all for free!
              </p>
              <div className="flex gap-4 justify-center flex-wrap mb-6">
                <Button asChild size="lg">
                  <Link href="/auth/signup">Get Started Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
              </div>
              
              {/* Trust Indicators - Compact */}
              <div className="flex gap-6 justify-center text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>100% Free</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Instant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" />
                  <span>PNG & SVG</span>
                </div>
              </div>
            </header>

            {/* Features Section - Compact */}
            <section className="grid md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <QrCode className="h-6 w-6 text-primary mb-2" aria-hidden="true" />
                  <CardTitle className="text-lg">Custom Design</CardTitle>
                  <CardDescription className="text-sm">
                    Custom templates, shapes, and visual effects for professional branding.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Palette className="h-6 w-6 text-primary mb-2" aria-hidden="true" />
                  <CardTitle className="text-lg">Add Logo</CardTitle>
                  <CardDescription className="text-sm">
                    Embed your logo and customize colors to match your brand identity.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <BarChart3 className="h-6 w-6 text-primary mb-2" aria-hidden="true" />
                  <CardTitle className="text-lg">Analytics & Tracking</CardTitle>
                  <CardDescription className="text-sm">
                    Track scans with detailed analytics including location and device data.
                  </CardDescription>
                </CardHeader>
              </Card>
            </section>

            {/* Interactive Demo Section - Simplified */}
            <section className="max-w-6xl mx-auto mb-12">
              <Card>
                <CardHeader className="text-center pb-4">
                  <CardTitle>Try It Now</CardTitle>
                  <CardDescription>
                    Generate your first QR code instantly. Sign up to unlock advanced features.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <QRGenerator />
                </CardContent>
              </Card>
            </section>

            {/* SEO Content Section */}
            <section className="max-w-4xl mx-auto mb-12">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
                  Why Choose BotrixAI QR Generator?
                </h2>
                <div className="space-y-6 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">BotrixAI QR Generator</strong> is the leading free QR code generator that empowers businesses and individuals to create professional, branded QR codes in seconds. Whether you're searching for "qr generator botrix ai" or "botrix ai qr generator", you've found the perfect solution for all your QR code needs.
                  </p>
                  <p>
                    Our <strong className="text-foreground">BotrixAI QR Code Generator</strong> offers advanced features including logo embedding, color customization, analytics tracking, and multiple export formats. Create dynamic QR codes that track scans, locations, and device types—all without any cost.
                  </p>
                  <p>
                    With <strong className="text-foreground">BotrixAI QR Generator</strong>, you can generate unlimited QR codes for websites, contact information, WiFi credentials, UPI payments, and more. Our platform combines ease of use with powerful customization options, making it the ideal choice for marketing campaigns, business cards, product packaging, and digital signage.
                  </p>
                  <h3 className="text-xl font-semibold mt-8 mb-4 text-foreground">
                    Key Features of BotrixAI QR Generator
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Free QR Code Generation:</strong> Create unlimited QR codes at no cost with BotrixAI</li>
                    <li><strong>Logo Customization:</strong> Embed your brand logo directly into QR codes</li>
                    <li><strong>Color Customization:</strong> Match QR codes to your brand colors and style</li>
                    <li><strong>Analytics Tracking:</strong> Monitor scans, locations, and engagement metrics</li>
                    <li><strong>Multiple Formats:</strong> Download QR codes as PNG or SVG for any use case</li>
                    <li><strong>Dynamic QR Codes:</strong> Update QR code content without regenerating</li>
                    <li><strong>Batch Generation:</strong> Create multiple QR codes simultaneously</li>
                    <li><strong>API Access:</strong> Integrate BotrixAI QR Generator into your applications</li>
                  </ul>
                  <p className="mt-6">
                    Start using <strong className="text-foreground">BotrixAI QR Generator</strong> today and experience the most powerful, free QR code generator available. Join thousands of users who trust BotrixAI for their QR code generation needs.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </>
    )
  }

  // User is logged in, show the full QR generator
  const user = session.user as { id?: string } | undefined
  return <QRGenerator userId={user?.id} />
}
