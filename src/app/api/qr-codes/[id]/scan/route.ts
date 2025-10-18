import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

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

    // First, check if the QR code exists and is active
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

    // Check if QR code is active
    if (!qrCode.isActive) {
      return NextResponse.json(
        { error: "QR code is inactive" },
        { status: 403 }
      )
    }

    // Check if QR code has expired
    if (qrCode.expiresAt && new Date(qrCode.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "QR code has expired" },
        { status: 403 }
      )
    }

    // Check if max scans limit has been reached
    if (qrCode.maxScans && qrCode.scanCount >= qrCode.maxScans) {
      return NextResponse.json(
        { error: "QR code scan limit reached" },
        { status: 403 }
      )
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

    // Return the redirect URL or original URL
    const redirectUrl = qrCode.redirectUrl || qrCode.url

    return NextResponse.json({
      success: true,
      redirectUrl,
      scanId: scan.id
    })
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
