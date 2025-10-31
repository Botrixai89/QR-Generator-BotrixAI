"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import QRGenerator from "@/components/qr-generator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, BarChart3, Palette, Download } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Create Beautiful{" "}
              <span className="text-primary">QR Codes</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Generate beautiful QR codes with advanced customization including templates, shapes, stickers, gradients, and effects. 
              Track your usage with analytics and manage all your codes in one place.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card>
              <CardHeader>
                <QrCode className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Advanced QR Codes</CardTitle>
                <CardDescription>
                  Create QR codes with templates, custom shapes, stickers, gradients, and visual effects
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Palette className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Professional Design</CardTitle>
                <CardDescription>
                  Choose from pre-designed templates or customize with advanced styling options
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  Track your QR code usage and download statistics with detailed analytics
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Demo QR Generator */}
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Try It Out</CardTitle>
              <CardDescription>
                Configure your QR code below. To generate and save, please sign up first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QRGenerator />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // User is logged in, show the full QR generator
  return <QRGenerator userId={session.user?.id} />
}
