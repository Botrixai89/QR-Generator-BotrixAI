import Link from "next/link"
import { ArrowRight, BookOpen, CheckCircle2, Compass, Shield, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const quickSteps = [
  { title: "1) Sign up or sign in", detail: "Create an account or log in to keep your QR codes saved." },
  { title: "2) Open the Generator", detail: "Start from the home page. Choose Basic for static or Dynamic for editable codes." },
  { title: "3) Add your content", detail: "Enter a URL or payload. For Dynamic, set redirect URL, optional expiry, and scan limits." },
  { title: "4) Style and brand", detail: "Pick colors, patterns, and add a logo to match your brand." },
  { title: "5) Generate & download", detail: "Click Generate, then download as PNG/SVG. Test once on your phone before sharing." },
  { title: "6) Manage in Dashboard", detail: "View, edit, pause/activate, and track scans. Buy credits when you’re low." },
]

const bestPractices = [
  "Always test a new QR with your phone camera before printing or sharing.",
  "Keep high-contrast colors for reliable scanning; avoid busy backgrounds.",
  "For Dynamic codes, set sensible expiration or scan limits for campaigns.",
  "Use logos sparingly; keep quiet zone (padding) clear around the QR.",
  "Monitor credits and scans from the dashboard to prevent disruptions.",
]

const troubleshooting = [
  "QR not scanning: check contrast, increase size, and ensure the quiet zone is visible.",
  "Redirect not working: verify the Dynamic redirect URL and that the code is active.",
  "No analytics: wait for first scans; confirm the code is Dynamic and published.",
  "Camera blocked: allow camera permission if using the built-in scanner.",
]

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        <section className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-100">
            <BookOpen className="h-4 w-4" /> How to use QR Generator
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Create, style, and track QR codes in minutes
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Follow these steps to generate reliable static or dynamic QR codes, keep them on-brand, and
            track performance without confusion.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/">
                Start Generating
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/dashboard">
                Go to Dashboard
                <Compass className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          {quickSteps.map((step) => (
            <Card key={step.title} className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 dark:text-gray-300">
                {step.detail}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pick the right QR type</CardTitle>
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3" /> Dynamic or Static
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">Dynamic:</span> Update
                destination anytime, see analytics, set limits, and pause/reactivate without reprinting.
              </div>
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">Static:</span> Best for
                permanent links (Wi‑Fi, contact, PDF) where the URL will not change.
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Branding & quality</CardTitle>
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" /> Reliable scans
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <ul className="space-y-2">
                {bestPractices.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-[2px]" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Troubleshooting</CardTitle>
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" /> Quick fixes
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <ul className="space-y-2">
                {troubleshooting.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-[2px]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Managing credits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p>View remaining credits and usage in the dashboard header. Dynamic and advanced features consume credits.</p>
              <p>Running low? Use the pricing page to top up before campaigns go live.</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Need help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p>Use this guide anytime. If you get stuck, reach out via the dashboard support link or email support.</p>
              <div className="flex gap-3">
                <Button variant="secondary" asChild>
                  <Link href="/dashboard">Open Dashboard</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

