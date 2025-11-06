import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { checkVanityUrlAvailability } from "@/lib/domain-routing"

/**
 * POST - Create or update vanity URL for a QR code
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { qrCodeId, vanityUrl, customSlug, domainId } = body

    if (!qrCodeId || !vanityUrl) {
      return NextResponse.json(
        { error: "QR code ID and vanity URL are required" },
        { status: 400 }
      )
    }

    // Validate vanity URL format (alphanumeric, hyphens, underscores only)
    const vanityUrlRegex = /^[a-z0-9-_]+$/i
    if (!vanityUrlRegex.test(vanityUrl)) {
      return NextResponse.json(
        { error: "Vanity URL must contain only alphanumeric characters, hyphens, and underscores" },
        { status: 400 }
      )
    }

    // Validate slug format if provided
    if (customSlug && !vanityUrlRegex.test(customSlug)) {
      return NextResponse.json(
        { error: "Custom slug must contain only alphanumeric characters, hyphens, and underscores" },
        { status: 400 }
      )
    }

    // Verify QR code belongs to user
    const { data: qrCode, error: qrError } = await supabaseAdmin!
      .from('QrCode')
      .select('id, userId')
      .eq('id', qrCodeId)
      .eq('userId', session.user.id)
      .single()

    if (qrError || !qrCode) {
      return NextResponse.json(
        { error: "QR code not found or access denied" },
        { status: 404 }
      )
    }

    // If domain is provided, verify it belongs to user
    if (domainId) {
      const { data: domain, error: domainError } = await supabaseAdmin!
        .from('QrCodeCustomDomain')
        .select('id, userId, isVerified, status')
        .eq('id', domainId)
        .eq('userId', session.user.id)
        .single()

      if (domainError || !domain || !domain.isVerified || domain.status !== 'active') {
        return NextResponse.json(
          { error: "Domain not found, not verified, or not active" },
          { status: 400 }
        )
      }
    }

    // Check if vanity URL is available
    const availability = await checkVanityUrlAvailability(vanityUrl, qrCodeId, domainId)
    if (!availability.available) {
      return NextResponse.json(
        { error: availability.conflict || "Vanity URL is already taken" },
        { status: 409 }
      )
    }

    // Check if slug is available if provided
    if (customSlug) {
      const slugAvailability = await checkVanityUrlAvailability(customSlug, qrCodeId, domainId)
      if (!slugAvailability.available) {
        return NextResponse.json(
          { error: slugAvailability.conflict || "Custom slug is already taken" },
          { status: 409 }
        )
      }
    }

    // Check if vanity URL already exists for this QR code
    const { data: existingMapping } = await supabaseAdmin!
      .from('QrCodeVanityUrl')
      .select('*')
      .eq('qrCodeId', qrCodeId)
      .single()

    let result
    if (existingMapping) {
      // Update existing mapping
      const { data: updatedMapping, error: updateError } = await supabaseAdmin!
        .from('QrCodeVanityUrl')
        .update({
          vanityUrl: vanityUrl.toLowerCase(),
          customSlug: customSlug ? customSlug.toLowerCase() : null,
          domainId: domainId || null,
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingMapping.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating vanity URL:", updateError)
        return NextResponse.json(
          { error: "Failed to update vanity URL" },
          { status: 500 }
        )
      }

      result = updatedMapping
    } else {
      // Create new mapping
      const { data: newMapping, error: insertError } = await supabaseAdmin!
        .from('QrCodeVanityUrl')
        .insert({
          qrCodeId,
          vanityUrl: vanityUrl.toLowerCase(),
          customSlug: customSlug ? customSlug.toLowerCase() : null,
          domainId: domainId || null
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error creating vanity URL:", insertError)
        return NextResponse.json(
          { error: "Failed to create vanity URL" },
          { status: 500 }
        )
      }

      result = newMapping
    }

    // Update QR code with vanity URL
    await supabaseAdmin!
      .from('QrCode')
      .update({
        vanityUrl: vanityUrl.toLowerCase(),
        customSlug: customSlug ? customSlug.toLowerCase() : null,
        customDomain: domainId || null
      })
      .eq('id', qrCodeId)

    return NextResponse.json({
      success: true,
      vanityUrl: result
    })
  } catch (error) {
    console.error("Error managing vanity URL:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET - Get vanity URLs for user's QR codes
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const qrCodeId = searchParams.get('qrCodeId')

    let query = supabaseAdmin!
      .from('QrCodeVanityUrl')
      .select(`
        *,
        qrCode:QrCode(id, title, url),
        domain:QrCodeCustomDomain(id, domain)
      `)

    if (qrCodeId) {
      // Verify QR code belongs to user
      const { data: qrCode } = await supabaseAdmin!
        .from('QrCode')
        .select('id, userId')
        .eq('id', qrCodeId)
        .eq('userId', session.user.id)
        .single()

      if (!qrCode) {
        return NextResponse.json(
          { error: "QR code not found or access denied" },
          { status: 404 }
        )
      }

      query = query.eq('qrCodeId', qrCodeId)
    } else {
      // Get all QR code IDs for user first
      const { data: userQrCodes } = await supabaseAdmin!
        .from('QrCode')
        .select('id')
        .eq('userId', session.user.id)

      if (!userQrCodes || userQrCodes.length === 0) {
        return NextResponse.json([])
      }

      const qrCodeIds = userQrCodes.map((q) => q.id)
      query = query.in('qrCodeId', qrCodeIds)
    }

    const { data: vanityUrls, error } = await query.order('createdAt', { ascending: false })

    if (error) {
      console.error("Error fetching vanity URLs:", error)
      return NextResponse.json(
        { error: "Failed to fetch vanity URLs" },
        { status: 500 }
      )
    }

    return NextResponse.json(vanityUrls || [])
  } catch (error) {
    console.error("Error fetching vanity URLs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove vanity URL
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const vanityUrlId = searchParams.get('id')
    const qrCodeId = searchParams.get('qrCodeId')

    if (!vanityUrlId && !qrCodeId) {
      return NextResponse.json(
        { error: "Vanity URL ID or QR code ID is required" },
        { status: 400 }
      )
    }

    let query = supabaseAdmin!
      .from('QrCodeVanityUrl')
      .delete()

    if (vanityUrlId) {
      // Verify ownership
      const { data: vanityUrl } = await supabaseAdmin!
        .from('QrCodeVanityUrl')
        .select('qrCodeId')
        .eq('id', vanityUrlId)
        .single()

      if (!vanityUrl) {
        return NextResponse.json(
          { error: "Vanity URL not found or access denied" },
          { status: 404 }
        )
      }

      // Verify QR code belongs to user
      const { data: qrCode } = await supabaseAdmin!
        .from('QrCode')
        .select('id, userId')
        .eq('id', vanityUrl.qrCodeId)
        .eq('userId', session.user.id)
        .single()

      if (!qrCode) {
        return NextResponse.json(
          { error: "Vanity URL not found or access denied" },
          { status: 404 }
        )
      }

      query = query.eq('id', vanityUrlId)
    } else if (qrCodeId) {
      // Verify QR code belongs to user
      const { data: qrCode } = await supabaseAdmin!
        .from('QrCode')
        .select('id, userId')
        .eq('id', qrCodeId)
        .eq('userId', session.user.id)
        .single()

      if (!qrCode) {
        return NextResponse.json(
          { error: "QR code not found or access denied" },
          { status: 404 }
        )
      }

      query = query.eq('qrCodeId', qrCodeId)
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting vanity URL:", error)
      return NextResponse.json(
        { error: "Failed to delete vanity URL" },
        { status: 500 }
      )
    }

    // Clear vanity URL from QR code
    if (qrCodeId) {
      await supabaseAdmin!
        .from('QrCode')
        .update({
          vanityUrl: null,
          customSlug: null,
          customDomain: null
        })
        .eq('id', qrCodeId)
    }

    return NextResponse.json({
      success: true,
      message: "Vanity URL deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting vanity URL:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

