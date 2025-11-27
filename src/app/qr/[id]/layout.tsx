import { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  
  // Fetch QR code data via API to avoid direct DB dependency
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qr-generator.botrixai.com"
    const response = await fetch(`${baseUrl}/api/qr-codes/${id}`, {
      cache: "no-store",
    })
    
    if (!response.ok) {
      return {
        title: "QR Code - BotrixAI QR Generator",
        description: "View and manage your QR code with BotrixAI QR Generator.",
        robots: { index: false, follow: false },
      }
    }
    
    const qrCode = await response.json()
    const title = qrCode.title || "QR Code"
    
    return {
      title: `${title} - BotrixAI QR Generator`,
      description: `View and manage your QR code "${title}". ${qrCode.isDynamic ? "Dynamic QR code with analytics tracking." : "Static QR code."} Created with BotrixAI QR Generator.`,
      robots: { index: false, follow: false },
      openGraph: {
        title: `${title} - QR Code`,
        description: `QR Code created with BotrixAI QR Generator`,
        type: "website",
      },
    }
  } catch {
    return {
      title: "QR Code - BotrixAI QR Generator",
      description: "View and manage your QR code with BotrixAI QR Generator.",
      robots: { index: false, follow: false },
    }
  }
}

export default function QRCodeLayout({ children }: Props) {
  return <>{children}</>
}

