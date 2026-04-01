"use client"

import { useEffect, useState } from "react"
import QRGenerator from "@/components/qr-generator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, BarChart3, Palette, Download, Zap, Shield } from "lucide-react"
import Link from "next/link"
import { StructuredData, OrganizationSchema } from "@/components/seo/structured-data"
import { useEffectiveSession } from "@/hooks/use-effective-session"

export default function Home() {
  const { session, status } = useEffectiveSession()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // ───────────────────────────────────────
  // AUTHENTICATED — full generator (no wrapper)
  // ───────────────────────────────────────
  if (session) {
    const user = session.user as { id?: string } | undefined
    return <QRGenerator userId={user?.id} />
  }

  // ───────────────────────────────────────
  // UNAUTHENTICATED — generator-first landing page
  // ───────────────────────────────────────
  return (
    <>
      {/* SEO Structured Data */}
      <StructuredData type="website" />
      <StructuredData type="software" />
      <StructuredData type="howto" />
      <StructuredData type="faq" />
      <OrganizationSchema />

      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-8 md:py-10">

          {/* ── Compact Headline ── */}
          <header className="text-center mb-6">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              <span className="text-gray-700 dark:text-gray-300">BotrixAI</span> QR Code Generator
            </h1>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Free QR code generator with logo &amp; analytics — no sign-up required to try
            </p>
          </header>

          {/* ── QR Generator — Hero Tool ── */}
          <section className="max-w-6xl mx-auto mb-10">
            <QRGenerator />
          </section>

          {/* ── Trust Badges ── */}
          <div className="flex gap-6 justify-center text-sm text-gray-500 dark:text-gray-400 flex-wrap mb-12">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Instant generation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Download className="h-4 w-4 text-blue-500" />
              <span>PNG &amp; SVG export</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">•</span>
              <Link href="/auth/signup" className="text-gray-700 dark:text-gray-300 font-medium hover:underline">
                Sign up free
              </Link>
              <span className="text-gray-400">to save &amp; track your QR codes</span>
            </div>
          </div>

          {/* ── Feature Cards ── */}
          <section className="grid md:grid-cols-3 gap-6 mb-14" aria-label="Features">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <QrCode className="h-6 w-6 text-gray-700 dark:text-gray-300 mb-2" aria-hidden="true" />
                <CardTitle className="text-lg text-gray-900 dark:text-white">Custom Design</CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                  Custom templates, shapes, and visual effects for professional branding.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <Palette className="h-6 w-6 text-gray-700 dark:text-gray-300 mb-2" aria-hidden="true" />
                <CardTitle className="text-lg text-gray-900 dark:text-white">Add Logo</CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                  Embed your logo and customize colors to match your brand identity.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <BarChart3 className="h-6 w-6 text-gray-700 dark:text-gray-300 mb-2" aria-hidden="true" />
                <CardTitle className="text-lg text-gray-900 dark:text-white">Analytics &amp; Tracking</CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                  Track scans with detailed analytics including location and device data.
                </CardDescription>
              </CardHeader>
            </Card>
          </section>

          {/* ── SEO Content ── */}
          <section className="max-w-4xl mx-auto mb-16" aria-label="About BotrixAI QR Generator">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
                Why Choose BotrixAI QR Generator?
              </h2>
              <div className="space-y-5 text-gray-600 dark:text-gray-300">
                <p>
                  <strong className="text-gray-900 dark:text-white">BotrixAI QR Generator</strong> is the leading free
                  QR code generator that empowers businesses and individuals to create professional, branded QR codes in
                  seconds. Whether you&apos;re searching for &quot;qr generator botrix ai&quot; or &quot;botrix ai qr
                  generator&quot;, you&apos;ve found the perfect solution for all your QR code needs.
                </p>
                <p>
                  Our <strong className="text-gray-900 dark:text-white">BotrixAI QR Code Generator</strong> offers
                  advanced features including logo embedding, color customization, analytics tracking, and multiple
                  export formats. Create dynamic QR codes that track scans, locations, and device types—all without any
                  cost.
                </p>
                <p>
                  With <strong className="text-gray-900 dark:text-white">BotrixAI QR Generator</strong>, you can
                  generate unlimited QR codes for websites, contact information, WiFi credentials, UPI payments, and
                  more. Our platform combines ease of use with powerful customization options, making it the ideal choice
                  for marketing campaigns, business cards, product packaging, and digital signage.
                </p>
                <h3 className="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
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
                  Start using <strong className="text-gray-900 dark:text-white">BotrixAI QR Generator</strong> today
                  and experience the most powerful, free QR code generator available. Join thousands of users who trust
                  BotrixAI for their QR code generation needs.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  )
}
