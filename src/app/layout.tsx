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
  title: "QR Generator - Create Beautiful QR Codes",
  description: "Generate and customize QR codes with logos, colors, and watermarks. Track your QR code usage with analytics.",
  keywords: ["QR code", "generator", "customize", "logo", "watermark", "analytics"],
  authors: [{ name: "QR Generator Team" }],
  creator: "QR Generator",
  publisher: "QR Generator",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "QR Generator - Create Beautiful QR Codes",
    description: "Generate and customize QR codes with logos, colors, and watermarks. Track your QR code usage with analytics.",
    url: "http://localhost:3000",
    siteName: "QR Generator",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QR Generator - Create Beautiful QR Codes",
    description: "Generate and customize QR codes with logos, colors, and watermarks. Track your QR code usage with analytics.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
