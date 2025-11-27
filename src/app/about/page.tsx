import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  QrCode, 
  Zap, 
  Shield, 
  Globe, 
  Users, 
  Award,
  ArrowRight,
  CheckCircle2,
  Building2,
  Heart
} from "lucide-react"

export const metadata: Metadata = {
  title: "About Us - QR Generator by BotrixAI | Free QR Code Generator",
  description: "Learn about QR Generator, a product by BotrixAI. We provide free, fast, and customizable QR code generation with advanced features for businesses and individuals.",
  keywords: "about qr generator, botrixai, qr code maker, free qr code, qr code company, qr code platform",
  openGraph: {
    title: "About Us - QR Generator by BotrixAI",
    description: "Learn about QR Generator, a product by BotrixAI. Free, fast, and customizable QR code generation.",
    type: "website",
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Building2 className="h-4 w-4" />
              About Us
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Empowering Businesses with
              <span className="text-primary"> Smart QR Solutions</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              QR Generator is a product by BotrixAI, designed to help businesses and individuals 
              create beautiful, customizable, and trackable QR codes in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                We believe that creating QR codes should be simple, fast, and accessible to everyone. 
                Our mission is to provide the most user-friendly QR code generator with powerful 
                customization options and analytics.
              </p>
              <p className="text-lg text-muted-foreground">
                Whether you&apos;re a small business owner, marketer, or individual, our platform 
                empowers you to create professional QR codes that connect the physical and digital worlds.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">10K+</div>
                <p className="text-sm text-muted-foreground">QR Codes Generated</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                <p className="text-sm text-muted-foreground">Happy Users</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                <p className="text-sm text-muted-foreground">Support</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose QR Generator?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform offers everything you need to create, customize, and track QR codes
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Generate QR codes instantly with our optimized platform. No waiting, no delays.
                </p>
              </CardContent>
            </Card>
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fully Customizable</h3>
                <p className="text-muted-foreground">
                  Choose colors, styles, templates, and add your logo to match your brand identity.
                </p>
              </CardContent>
            </Card>
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
                <p className="text-muted-foreground">
                  Enterprise-grade security with 99.9% uptime guarantee for your peace of mind.
                </p>
              </CardContent>
            </Card>
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Dynamic QR Codes</h3>
                <p className="text-muted-foreground">
                  Track scans, update destinations, and get detailed analytics with dynamic QR codes.
                </p>
              </CardContent>
            </Card>
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Social Media Ready</h3>
                <p className="text-muted-foreground">
                  Pre-built templates for Instagram, WhatsApp, Facebook, LinkedIn, and more.
                </p>
              </CardContent>
            </Card>
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Free Forever</h3>
                <p className="text-muted-foreground">
                  Basic QR code generation is completely free. Upgrade for advanced features.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About BotrixAI Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powered by BotrixAI</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              QR Generator is proudly developed by BotrixAI, a leading AI automation company 
              trusted by 500+ businesses worldwide.
            </p>
          </div>
          <Card className="p-8">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">About BotrixAI</h3>
                  <p className="text-muted-foreground mb-6">
                    BotrixAI is an AI automation platform that helps businesses reduce support costs 
                    by 60% while improving customer satisfaction. With features like real-time voice 
                    emotion detection, zero-code deployment, and industry-specific AI models, BotrixAI 
                    is transforming how businesses interact with their customers.
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>60% Cost Reduction in Customer Support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>Deploy AI Agents in 10 Minutes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>99.9% Accuracy with Custom AI Models</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>200ms Response Time</span>
                    </li>
                  </ul>
                  <Button asChild>
                    <a href="https://botrixai.com" target="_blank" rel="noopener noreferrer">
                      Visit BotrixAI
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background p-6 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary mb-1">500+</div>
                    <p className="text-sm text-muted-foreground">Enterprise Customers</p>
                  </div>
                  <div className="bg-background p-6 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary mb-1">50+</div>
                    <p className="text-sm text-muted-foreground">Languages Supported</p>
                  </div>
                  <div className="bg-background p-6 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary mb-1">100+</div>
                    <p className="text-sm text-muted-foreground">Integrations</p>
                  </div>
                  <div className="bg-background p-6 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary mb-1">1M+</div>
                    <p className="text-sm text-muted-foreground">Messages Daily</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">User First</h3>
              <p className="text-muted-foreground">
                Every feature we build starts with understanding our users&apos; needs and challenges.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p className="text-muted-foreground">
                We continuously improve our platform with the latest technologies and best practices.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trust & Security</h3>
              <p className="text-muted-foreground">
                Your data security and privacy are our top priorities. We never compromise on trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Your QR Code?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users who trust QR Generator for their QR code needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/">
                Create QR Code Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Have questions? We&apos;d love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="mailto:contact@botrixai.com" 
                className="text-primary hover:underline flex items-center gap-2"
              >
                contact@botrixai.com
              </a>
              <span className="hidden sm:inline text-muted-foreground">•</span>
              <a 
                href="tel:+919981292605" 
                className="text-primary hover:underline flex items-center gap-2"
              >
                +91 99812 92605
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

