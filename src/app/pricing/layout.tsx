import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing - BotrixAI QR Generator | Affordable QR Code Plans",
  description: "Choose the perfect plan for your QR code needs. Free plan with 10 credits or Pro plan with 100 credits, advanced customization, dynamic QR codes, and analytics.",
  keywords: [
    "qr code pricing",
    "qr generator plans",
    "botrixai pricing",
    "free qr code generator",
    "pro qr code plan",
    "qr code credits",
    "affordable qr codes",
  ],
  openGraph: {
    title: "Pricing - BotrixAI QR Generator",
    description: "Choose the perfect plan for your QR code needs. Free or Pro plans available.",
    type: "website",
    url: "https://qr-generator.botrixai.com/pricing",
  },
  twitter: {
    card: "summary",
    title: "Pricing - BotrixAI QR Generator",
    description: "Choose the perfect plan for your QR code needs.",
  },
  alternates: {
    canonical: "https://qr-generator.botrixai.com/pricing",
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

