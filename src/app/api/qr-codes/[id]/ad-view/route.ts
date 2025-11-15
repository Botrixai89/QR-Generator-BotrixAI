import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { headers } from "next/headers"

/**
 * POST - Record an ad view when a user sees an ad while scanning a QR code
 * This is used for tracking ad impressions and revenue
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { adType, adProvider } = body

    // Get client IP and user agent
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    // Verify QR code exists
    const { data: qrCode, error: qrError } = await supabaseAdmin!
      .from('QrCode')
      .select('id, userId, showAds, adDisplayCount')
      .eq('id', id)
      .single()

    if (qrError || !qrCode) {
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404 }
      )
    }

    // Only record ad views if ads are enabled for this QR code
    if (qrCode.showAds === false) {
      return NextResponse.json(
        { error: "Ads are disabled for this QR code" },
        { status: 400 }
      )
    }

    // Record the ad view
    const { data: adView, error: adError } = await supabaseAdmin!
      .from('QrCodeAdView')
      .insert({
        qrCodeId: id,
        userAgent,
        ipAddress: ipAddress.split(',')[0].trim(),
        adType: adType || 'interstitial',
        adProvider: adProvider || 'custom',
        revenueCents: 0 // Can be updated later based on actual ad revenue
      })
      .select()
      .single()

    if (adError) {
      console.error("Error recording ad view:", adError)
      return NextResponse.json(
        { error: "Failed to record ad view" },
        { status: 500 }
      )
    }

    // Update ad display count on QR code
    await supabaseAdmin!
      .from('QrCode')
      .update({
        adDisplayCount: (qrCode.adDisplayCount || 0) + 1
      })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      adViewId: adView.id
    })
  } catch (error) {
    console.error("Error processing ad view:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

