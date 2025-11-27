import type { Metadata } from "next";
import { Poppins, Fira_Code } from "next/font/google";
import "./globals.css";
import { LayoutClientWrapper } from "@/components/layout-client-wrapper";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "BotrixAI QR Generator - Free QR Code Generator with Logo & Analytics | qr-generator.botrixai.com",
    template: "%s | BotrixAI QR Generator"
  },
  description: "BotrixAI QR Generator - Create stunning, customizable QR codes instantly! Free QR code generator with logo, color customization, analytics tracking, and multiple export formats. Perfect for business, marketing, payments & more!",
  keywords: [
    "qr generator botrix ai",
    "botrix ai qr generator",
    "botrixai qr generator",
    "BotrixAI QR Generator",
    "QR generator BotrixAI",
    "BotrixAI QR code generator",
    "BotrixAI QR code maker",
    "QR code generator BotrixAI",
    "BotrixAI free QR generator",
    "qr-generator.botrixai.com",
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
  authors: [{ name: "BotrixAI", url: "https://qr-generator.botrixai.com" }],
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
  metadataBase: new URL("https://qr-generator.botrixai.com"),
  alternates: {
    canonical: "https://qr-generator.botrixai.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://qr-generator.botrixai.com",
    siteName: "BotrixAI QR Generator",
    title: "BotrixAI QR Generator - Free QR Code Generator with Logo & Analytics",
    description: "BotrixAI QR Generator - Create stunning, customizable QR codes instantly! Free QR code generator with logo, color customization, analytics tracking, and multiple export formats.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "BotrixAI QR Code Generator - Create Beautiful Custom QR Codes",
        type: "image/svg+xml",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@BotrixAI",
    creator: "@BotrixAI",
    title: "BotrixAI QR Generator - Free QR Code Generator with Logo & Analytics",
    description: "BotrixAI QR Generator - Create stunning, customizable QR codes instantly! Free QR code generator with logo, color customization, and analytics tracking.",
    images: ["/twitter-image.svg"],
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
  // TODO: Add your actual verification codes from Google Search Console, Bing Webmaster, etc.
  verification: {
    google: "oPKtGmXArI-1q2c_17cFYPrLUNmURm0D1fz5GFUhYqw",
    // yandex: "your-yandex-verification-code",
    // other: {
    //   bing: ["your-bing-verification-code"],
    // },
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
        className={`${poppins.variable} ${firaCode.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <LayoutClientWrapper>
          {children}
        </LayoutClientWrapper>
      </body>
    </html>
  );
}
