import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { rateLimit } from "@/lib/rate-limit"
import { assertWithinMonthlyScanQuota, getUserPlan, hasFeature } from "@/lib/entitlements"
import { getErrorPage } from "@/lib/error-pages"

// Edge caching configuration for public scan endpoints
export const runtime = 'nodejs'
export const revalidate = 60 // Revalidate every 60 seconds

// POST - Record a QR code scan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      userAgent, 
      ipAddress, 
      country, 
      city, 
      device, 
      browser, 
      os 
    } = body

    // Global per-IP rate limit for scans
    const ipHeader = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
    const ip = (ipAddress || ipHeader || 'unknown').split(',')[0].trim()
    const limit = await rateLimit({ key: `ip:${ip}`, route: '/api/qr-codes/[id]/scan:POST', windowSeconds: 10, maxRequests: 30 })
    if (!limit.allowed) {
      return NextResponse.json({ error: 'rate_limited', retryAfter: limit.retryAfter }, { status: 429 })
    }

    // First, check if the QR code exists and is active
    const { data: qrCode, error: qrError } = await supabaseAdmin!
      .from('QrCode')
      .select('*')
      .eq('id', id)
      .single()

    if (qrError || !qrCode) {
      // Get custom 404 page or return default
      const notFoundPage = await getErrorPage('404', {
        qrCodeId: id,
        title: 'QR Code Not Found',
        message: 'The QR code you are looking for could not be found.'
      })
      
      return new NextResponse(notFoundPage, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Check if QR code is active
    if (!qrCode.isActive) {
      return NextResponse.json(
        { error: "QR code is inactive" },
        { status: 403 }
      )
    }

    // Check if QR code has expired
    if (qrCode.expiresAt && new Date(qrCode.expiresAt) < new Date()) {
      // Get custom expiry page or return default
      const expiryPage = await getErrorPage('expired', {
        qrCodeId: id,
        domainId: qrCode.customDomain || undefined,
        title: qrCode.title || undefined,
        message: 'This QR code has expired and is no longer available.',
        showQRInfo: true,
        redirectUrl: qrCode.url
      })
      
      return new NextResponse(expiryPage, {
        status: 403,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Check if max scans limit has been reached
    if (qrCode.maxScans && qrCode.scanCount >= qrCode.maxScans) {
      // Get custom expiry page or return default
      const expiryPage = await getErrorPage('expired', {
        qrCodeId: id,
        domainId: qrCode.customDomain || undefined,
        title: qrCode.title || undefined,
        message: 'This QR code has reached its scan limit and is no longer available.',
        showQRInfo: true,
        redirectUrl: qrCode.url
      })
      
      return new NextResponse(expiryPage, {
        status: 403,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Check owner's monthly scan quota before recording
    try {
      await assertWithinMonthlyScanQuota(qrCode.userId)
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status || 403
      const code = (e as { code?: string })?.code || 'plan_limit'
      const message = (e as { message?: string })?.message
      return NextResponse.json({ error: code, message }, { status })
    }

    // Record the scan
    const { data: scan, error: scanError } = await supabaseAdmin!
      .from('QrCodeScan')
      .insert({
        qrCodeId: id,
        userAgent,
        ipAddress,
        country,
        city,
        device,
        browser,
        os
      })
      .select()
      .single()

    if (scanError) {
      console.error("Error recording scan:", scanError)
      return NextResponse.json(
        { error: "Failed to record scan" },
        { status: 500 }
      )
    }

    // Update scan count and last scanned timestamp
    const { error: updateError } = await supabaseAdmin!
      .from('QrCode')
      .update({
        scanCount: qrCode.scanCount + 1,
        lastScannedAt: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error("Error updating scan count:", updateError)
    }

    // Check scan threshold (async, don't block response)
    try {
      const { checkScanThreshold } = await import('@/lib/threshold-monitoring')
      checkScanThreshold(id, qrCode.userId).catch(console.error)
    } catch (error) {
      // Don't fail scan if threshold check fails
      console.error('Error checking scan threshold:', error)
    }

    // Check if ads should be shown (for free plan users)
    const ownerPlan = await getUserPlan(qrCode.userId)
    const shouldShowAds = !hasFeature(ownerPlan, 'removeAdsAllowed') && 
                         (qrCode.showAds !== false) // Default to true unless explicitly disabled

    // Return the redirect URL or original URL
    const redirectUrl = qrCode.redirectUrl || qrCode.url

    // Set cache headers for public scan endpoints (edge caching)
    const response = NextResponse.json({
      success: true,
      redirectUrl,
      scanId: scan.id,
      showAds: shouldShowAds
    })

    // Add cache headers for edge caching
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=60')
    response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=60')

    return response
  } catch (error) {
    console.error("Error processing QR code scan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Get QR code analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get QR code details
    const { data: qrCode, error: qrError } = await supabaseAdmin!
      .from('QrCode')
      .select('*')
      .eq('id', id)
      .single()

    if (qrError || !qrCode) {
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404 }
      )
    }

    // Get scan analytics
    const { data: scans, error: scansError } = await supabaseAdmin!
      .from('QrCodeScan')
      .select('*')
      .eq('qrCodeId', id)
      .order('scannedAt', { ascending: false })

    if (scansError) {
      console.error("Error fetching scans:", scansError)
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: 500 }
      )
    }

    // Calculate analytics
    const totalScans = scans.length
    const uniqueDevices = new Set(scans.map(scan => scan.device)).size
    const uniqueCountries = new Set(scans.map(scan => scan.country).filter(Boolean)).size
    const uniqueCities = new Set(scans.map(scan => scan.city).filter(Boolean)).size

    // Group scans by date
    const scansByDate = scans.reduce((acc, scan) => {
      const date = new Date(scan.scannedAt).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Group scans by device
    const scansByDevice = scans.reduce((acc, scan) => {
      acc[scan.device || 'Unknown'] = (acc[scan.device || 'Unknown'] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Group scans by country
    const scansByCountry = scans.reduce((acc, scan) => {
      if (scan.country) {
        acc[scan.country] = (acc[scan.country] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      qrCode: {
        id: qrCode.id,
        title: qrCode.title,
        url: qrCode.url,
        isDynamic: qrCode.isDynamic,
        isActive: qrCode.isActive,
        scanCount: qrCode.scanCount,
        createdAt: qrCode.createdAt,
        lastScannedAt: qrCode.lastScannedAt,
        dynamicContent: qrCode.dynamicContent,
        redirectUrl: qrCode.redirectUrl,
        foregroundColor: qrCode.foregroundColor,
        backgroundColor: qrCode.backgroundColor,
        dotType: qrCode.dotType,
        cornerType: qrCode.cornerType,
        hasWatermark: qrCode.hasWatermark,
        logoUrl: qrCode.logoUrl
      },
      analytics: {
        totalScans,
        uniqueDevices,
        uniqueCountries,
        uniqueCities,
        scansByDate,
        scansByDevice,
        scansByCountry,
        recentScans: scans.slice(0, 10)
      }
    })
  } catch (error) {
    console.error("Error fetching QR code analytics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
