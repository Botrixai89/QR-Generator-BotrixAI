"use client"

import { ErrorBoundary } from "@/components/error-boundary"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { AuthProvider } from "@/components/providers/session-provider"
import { Toaster } from "@/components/ui/sonner"
import Navigation from "@/components/navigation"
import { WebVitals } from "@/components/web-vitals"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"

interface LayoutClientWrapperProps {
  children: React.ReactNode
}

export function LayoutClientWrapper({ children }: LayoutClientWrapperProps) {
  return (
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
  )
}

