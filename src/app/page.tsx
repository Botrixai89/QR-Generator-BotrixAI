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
          <div className="container mx-auto px-4 py-16">
            {/* Hero Section - SEO Optimized */}
            <header className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Free QR Code Generator with{" "}
                <span className="text-primary">Logo & Analytics</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
                Create stunning, customizable QR codes instantly with BotrixAI. Add your logo, customize colors, 
                track scans with analytics, and download in multiple formats—all for free!
              </p>
              <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
                Perfect for business cards, marketing campaigns, product packaging, event promotions, 
                payments (UPI), restaurant menus, and more. No design skills required.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button asChild size="lg">
                  <Link href="/auth/signup">Get Started Free</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div className="mt-8 flex gap-6 justify-center text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>100% Free</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Instant Generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" />
                  <span>PNG & SVG Export</span>
                </div>
              </div>
            </header>

            {/* Features Section - SEO Keyword Rich */}
            <section className="grid md:grid-cols-3 gap-8 mb-16">
              <article>
                <Card>
                  <CardHeader>
                    <QrCode className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
                    <CardTitle>Custom QR Code Design</CardTitle>
                    <CardDescription>
                      Create professional QR codes with custom templates, shapes, stickers, gradients, and visual effects. 
                      Perfect for branding and marketing materials.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </article>
              <article>
                <Card>
                  <CardHeader>
                    <Palette className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
                    <CardTitle>Add Logo to QR Code</CardTitle>
                    <CardDescription>
                      Upload your company logo and embed it directly in your QR code. 
                      Customize colors, dot styles, and corner styles to match your brand identity.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </article>
              <article>
                <Card>
                  <CardHeader>
                    <BarChart3 className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
                    <CardTitle>QR Code Analytics & Tracking</CardTitle>
                    <CardDescription>
                      Track QR code scans with detailed analytics. Monitor scan location, device type, 
                      time stamps, and download statistics from your dashboard.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </article>
            </section>

            {/* Interactive Demo Section */}
            <section className="max-w-7xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Try Our Free QR Code Generator</CardTitle>
                  <CardDescription>
                    Generate your first QR code right now! Enter any URL, text, or UPI ID below. 
                    Sign up to unlock advanced features like logo upload, analytics, and unlimited QR codes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <QRGenerator />
                </CardContent>
              </Card>
            </section>

            {/* SEO Content Section */}
            <section className="mt-16 max-w-4xl mx-auto prose prose-lg dark:prose-invert">
              <h2 className="text-3xl font-bold mb-4">Why Choose BotrixAI QR Code Generator?</h2>
              <p className="text-muted-foreground mb-6">
                BotrixAI is the most advanced free QR code generator online. Whether you need QR codes for 
                business cards, marketing campaigns, product packaging, or payment collection, our platform 
                provides everything you need to create, customize, and track professional QR codes.
              </p>
              
              <h3 className="text-2xl font-semibold mb-3">Key Features:</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li><strong>Unlimited QR Codes:</strong> Generate as many QR codes as you need, completely free</li>
                <li><strong>Custom Logo Integration:</strong> Add your brand logo to make QR codes uniquely yours</li>
                <li><strong>Color Customization:</strong> Match your brand colors with full RGB customization</li>
                <li><strong>Multiple Export Formats:</strong> Download as PNG for print or SVG for scalability</li>
                <li><strong>Analytics Dashboard:</strong> Track every scan with detailed metrics and insights</li>
                <li><strong>Dynamic QR Codes:</strong> Update destination URLs without reprinting codes</li>
                <li><strong>High-Resolution Output:</strong> Print-ready quality for professional use</li>
                <li><strong>Mobile Responsive:</strong> Create QR codes on any device, anywhere</li>
              </ul>

              <h3 className="text-2xl font-semibold mb-3">Common Use Cases:</h3>
              <p className="text-muted-foreground">
                ✓ <strong>Business & Marketing:</strong> Business cards, flyers, posters, billboards<br/>
                ✓ <strong>E-commerce:</strong> Product packaging, promotional materials<br/>
                ✓ <strong>Restaurants:</strong> Digital menus, table ordering systems<br/>
                ✓ <strong>Events:</strong> Ticketing, registration, event information<br/>
                ✓ <strong>Payments:</strong> UPI payments, invoice generation<br/>
                ✓ <strong>Education:</strong> Learning resources, assignment submissions
              </p>
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
