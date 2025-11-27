"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { StructuredData } from "./structured-data"

interface BreadcrumbItem {
  name: string
  href: string
}

// Map of path segments to display names
const pathNames: Record<string, string> = {
  dashboard: "Dashboard",
  pricing: "Pricing",
  about: "About",
  features: "Features",
  blog: "Blog",
  docs: "Documentation",
  "use-cases": "Use Cases",
  changelog: "Changelog",
  settings: "Settings",
  billing: "Billing",
  domains: "Domains",
  developers: "Developers",
  organizations: "Organizations",
  notifications: "Notifications",
  admin: "Admin",
  auth: "Authentication",
  signin: "Sign In",
  signup: "Sign Up",
  qr: "QR Code",
}

export function Breadcrumbs() {
  const pathname = usePathname()
  
  // Don't show breadcrumbs on homepage
  if (pathname === "/") return null
  
  const segments = pathname.split("/").filter(Boolean)
  
  // Build breadcrumb items
  const items: BreadcrumbItem[] = [
    { name: "Home", href: "/" },
  ]
  
  let currentPath = ""
  segments.forEach((segment) => {
    currentPath += `/${segment}`
    // Skip dynamic segments like [id]
    if (!segment.startsWith("[") && !segment.match(/^[a-f0-9-]{36}$/i)) {
      items.push({
        name: pathNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
      })
    }
  })
  
  // Don't show if only home
  if (items.length <= 1) return null
  
  // Generate structured data for breadcrumbs
  const structuredDataItems = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `https://qr-generator.botrixai.com${item.href}`,
  }))

  return (
    <>
      <StructuredData type="breadcrumb" data={{ items: structuredDataItems }} />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            
            return (
              <li key={item.href} className="flex items-center gap-1">
                {index === 0 ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <Home className="h-3.5 w-3.5" />
                    <span className="sr-only">{item.name}</span>
                  </Link>
                ) : isLast ? (
                  <span className="font-medium text-foreground">{item.name}</span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                )}
                {!isLast && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}

