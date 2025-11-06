"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getOriginalUrl } from "@/lib/url-shortener"

interface ShortUrlPageProps {
  params: Promise<{ code: string }>
}

export default function ShortUrlPage({ params }: ShortUrlPageProps) {
  const router = useRouter()
  const [resolvedParams, setResolvedParams] = useState<{ code: string } | null>(null)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (resolvedParams?.code) {
      const originalUrl = getOriginalUrl(resolvedParams.code)
      
      if (originalUrl) {
        // Redirect to the original URL
        window.location.href = originalUrl
      } else {
        // Short code not found, redirect to home
        router.push("/")
      }
    }
  }, [resolvedParams, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
