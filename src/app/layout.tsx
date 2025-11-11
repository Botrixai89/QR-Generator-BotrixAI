import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Navigation from "@/components/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import { WebVitals } from "@/components/web-vitals";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BotrixAI QR Generator - Free QR Code Generator with Logo & Analytics",
    template: "%s | BotrixAI QR Generator"
  },
  description: "BotrixAI QR Generator - Create stunning, customizable QR codes instantly! Free QR code generator with logo, color customization, analytics tracking, and multiple export formats. Perfect for business, marketing, payments & more!",
  keywords: [
    "BotrixAI QR Generator",
    "QR generator BotrixAI",
    "BotrixAI QR code generator",
    "BotrixAI QR code maker",
    "QR code generator BotrixAI",
    "BotrixAI free QR generator",
    "QR code generator",
    "free QR code maker",
    "custom QR code",
    "QR code with logo",
    "QR code generator online",
    "create QR code",
    "QR code design",
    "dynamic QR codes",
    "QR code analytics",
    "business QR code",
    "UPI QR code",
    "payment QR code",
    "branded QR code",
    "QR code templates",
    "professional QR codes",
    "QR code tracking",
    "marketing QR codes",
    "customizable QR generator",
    "BotrixAI",
    "advanced QR code maker"
  ],
  authors: [{ name: "BotrixAI", url: "https://qr-generator-botrix-ai.vercel.app" }],
  creator: "BotrixAI",
  publisher: "BotrixAI",
  applicationName: "BotrixAI QR Generator",
  category: "Technology",
  classification: "QR Code Generator",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://qr-generator-botrix-ai.vercel.app"),
  alternates: {
    canonical: "https://qr-generator-botrix-ai.vercel.app",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://qr-generator-botrix-ai.vercel.app",
    siteName: "BotrixAI QR Generator",
    title: "BotrixAI QR Generator - Free QR Code Generator with Logo & Analytics",
    description: "BotrixAI QR Generator - Create stunning, customizable QR codes instantly! Free QR code generator with logo, color customization, analytics tracking, and multiple export formats.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BotrixAI QR Code Generator - Create Beautiful Custom QR Codes",
        type: "image/png",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@BotrixAI",
    creator: "@BotrixAI",
    title: "BotrixAI QR Generator - Free QR Code Generator with Logo & Analytics",
    description: "BotrixAI QR Generator - Create stunning, customizable QR codes instantly! Free QR code generator with logo, color customization, and analytics tracking.",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code-here",
    yandex: "yandex-verification-code-here",
    other: {
      bing: ["bing-verification-code-here"],
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <WebVitals />
              <Navigation />
              <main className="pt-16">
                {children}
              </main>
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
