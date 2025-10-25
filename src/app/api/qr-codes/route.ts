import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { randomUUID } from "crypto"
import { shouldShortenUrl, createShortUrl, storeUrlMapping } from "@/lib/url-shortener"

export async function POST(request: NextRequest) {
  try {
    console.log("=== QR Code API POST Request Started ===")
    
    // Check environment variables
    console.log("Environment check:")
    console.log("- NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing")
    console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing")
    console.log("- SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Missing")
    
    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    )

    const sessionPromise = getServerSession(authOptions)
    const session = await Promise.race([sessionPromise, timeoutPromise]) as { user?: { id: string } } | null
    
    console.log("Session check:", session ? "Found" : "Not found")
    console.log("User ID:", session?.user?.id || "None")
    
    if (!session?.user?.id) {
      console.log("ERROR: No valid session or user ID")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check user credits before creating QR code
    const { data: user, error: userError } = await supabaseAdmin!
      .from('User')
      .select('credits')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      console.error("Error fetching user credits:", userError)
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      )
    }

    if ((user.credits || 0) <= 0) {
      console.log("User has no credits:", user.credits)
      return NextResponse.json(
        { error: "no_credits" },
        { status: 402 }
      )
    }

    const formData = await request.formData()
    const url = formData.get("url") as string
    const title = formData.get("title") as string
    const foregroundColor = formData.get("foregroundColor") as string
    const backgroundColor = formData.get("backgroundColor") as string
    const dotType = formData.get("dotType") as string
    const cornerType = formData.get("cornerType") as string
    const hasWatermark = formData.get("hasWatermark") === "true"
    const logoFile = formData.get("logo") as File | null
    const isDynamic = formData.get("isDynamic") === "true"
    const dynamicContent = formData.get("dynamicContent") as string
    const expiresAt = formData.get("expiresAt") as string
    const maxScans = formData.get("maxScans") as string
    const redirectUrl = formData.get("redirectUrl") as string
    
    // Advanced QR code features
    const shape = formData.get("shape") as string
    const template = formData.get("template") as string
    const gradient = formData.get("gradient") as string
    const sticker = formData.get("sticker") as string
    const effects = formData.get("effects") as string
    const eyePattern = formData.get("eyePattern") as string

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      )
    }

    // Use original URL directly (URL shortening disabled for now)
    const originalUrl = url

    let logoUrl = null
    if (logoFile && logoFile.size > 0) {
      try {
        // Validate file type on server side
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
        if (!allowedTypes.includes(logoFile.type)) {
          return NextResponse.json(
            { error: "Invalid file type. Please upload an image file (JPEG, PNG, GIF, WebP, or SVG)." },
            { status: 400 }
          )
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB in bytes
        if (logoFile.size > maxSize) {
          return NextResponse.json(
            { error: "File too large. Please upload an image smaller than 5MB." },
            { status: 400 }
          )
        }
        
        // Create a unique filename
        const timestamp = Date.now()
        const sanitizedFileName = logoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}-${sanitizedFileName}`
        
        // Convert File to Buffer
        const bytes = await logoFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Upload to Supabase Storage instead of local filesystem
        const { data: uploadData, error: uploadError } = await supabaseAdmin!
          .storage
          .from('qr-logos')
          .upload(fileName, buffer, {
            contentType: logoFile.type,
            upsert: false
          })

        if (uploadError) {
          console.error("Error uploading to Supabase Storage:", uploadError)
          return NextResponse.json(
            { error: "Failed to upload logo. Please try again." },
            { status: 500 }
          )
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin!
          .storage
          .from('qr-logos')
          .getPublicUrl(fileName)

        logoUrl = urlData.publicUrl
        console.log("Logo uploaded successfully to Supabase:", logoUrl)
      } catch (error) {
        console.error("Error uploading logo:", error)
        return NextResponse.json(
          { error: "Failed to upload logo. Please try again." },
          { status: 500 }
        )
      }
    }

    console.log("Form data received:")
    console.log("- URL:", url)
    console.log("- Title:", title)
    console.log("- Original URL:", originalUrl)
    
    const qrCodeId = randomUUID()
    const now = new Date().toISOString()
    
    console.log("Attempting to insert into database...")
    console.log("SupabaseAdmin available:", !!supabaseAdmin)
    
    // Parse dynamic content if provided
    let parsedDynamicContent = null
    if (dynamicContent) {
      try {
        parsedDynamicContent = JSON.parse(dynamicContent)
      } catch (error) {
        console.error("Error parsing dynamic content:", error)
      }
    }

    // Parse advanced features
    let parsedGradient = null
    if (gradient) {
      try {
        parsedGradient = JSON.parse(gradient)
      } catch (error) {
        console.error("Error parsing gradient:", error)
      }
    }

    let parsedSticker = null
    if (sticker) {
      try {
        parsedSticker = JSON.parse(sticker)
      } catch (error) {
        console.error("Error parsing sticker:", error)
      }
    }

    let parsedEffects = null
    if (effects) {
      try {
        parsedEffects = JSON.parse(effects)
      } catch (error) {
        console.error("Error parsing effects:", error)
      }
    }

    // First, try to insert with all dynamic fields
    let insertData: any = {
      id: qrCodeId,
      userId: session.user.id,
      url: originalUrl, // Store the original URL for QR code generation
      title: title || originalUrl,
      foregroundColor,
      backgroundColor,
      dotType,
      cornerType,
      hasWatermark,
      logoUrl,
      createdAt: now,
      updatedAt: now,
    }

    // Add dynamic fields if they exist
    if (isDynamic !== undefined) insertData.isDynamic = isDynamic || false
    if (parsedDynamicContent !== null) insertData.dynamicContent = parsedDynamicContent
    if (expiresAt) insertData.expiresAt = expiresAt
    if (maxScans) insertData.maxScans = parseInt(maxScans)
    if (redirectUrl) insertData.redirectUrl = redirectUrl

    // Add advanced features
    if (shape) insertData.shape = shape
    if (template) insertData.template = template
    if (eyePattern) insertData.eyePattern = eyePattern
    if (parsedGradient) insertData.gradient = parsedGradient
    if (parsedSticker) insertData.sticker = parsedSticker
    if (parsedEffects) insertData.effects = parsedEffects

    const { data: qrCode, error } = await supabaseAdmin!
      .from('QrCode')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("Database error details:", error)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)
      console.error("Error details:", error.details)
      return NextResponse.json(
        { error: "Failed to create QR code", details: error.message },
        { status: 500 }
      )
    }
    
    console.log("QR code created successfully:", qrCode)

    // Deduct 1 credit from user
    const { error: creditError } = await supabaseAdmin!
      .from('User')
      .update({
        credits: (user.credits || 0) - 1
      })
      .eq('id', session.user.id)

    if (creditError) {
      console.error("Error deducting credit:", creditError)
      // Note: QR code was already created, so we don't fail the request
      // This could be handled by a background job or manual reconciliation
    } else {
      console.log("Credit deducted successfully")
    }

    return NextResponse.json(qrCode, { status: 201 })
  } catch (error) {
    console.error("=== CRITICAL ERROR in QR Code API ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("Full error object:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    )

    const sessionPromise = getServerSession(authOptions)
    const session = await Promise.race([sessionPromise, timeoutPromise]) as { user?: { id: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: qrCodes, error } = await supabaseAdmin!
      .from('QrCode')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error("Error fetching QR codes:", error)
      return NextResponse.json(
        { error: "Failed to fetch QR codes" },
        { status: 500 }
      )
    }

    return NextResponse.json(qrCodes)
  } catch (error) {
    console.error("Error fetching QR codes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
