import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { randomUUID } from "crypto"
import { assertCanCreateQr, getUserPlan, hasFeature } from "@/lib/entitlements"
import { rateLimit } from "@/lib/rate-limit"
import { canAccessOrgResource } from "@/lib/rbac"
import { ApiErrors, handleApiError, createdResponse } from "@/lib/api-errors"
import { UserCreditsCache, QRCodeCache } from "@/lib/cache"

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
      return ApiErrors.unauthorized().toResponse()
    }

    // Global per-user rate limit for create
    const limit = await rateLimit({
      key: `user:${session.user.id}`,
      route: '/api/qr-codes:POST',
      windowSeconds: 60,
      maxRequests: 30,
    })
    if (!limit.allowed) {
      return ApiErrors.rateLimited(limit.retryAfter).toResponse()
    }

    // Credit check will be done atomically in the database function
    // This prevents race conditions and ensures data consistency

    // Enforce plan entitlements: QR creation limit
    try {
      await assertCanCreateQr(session.user.id)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'plan_limit'
      const status = (e as { status?: number })?.status || 403
      const code = (e as { code?: string })?.code || 'plan_limit'
      return NextResponse.json({ error: code, message }, { status })
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
    const organizationId = formData.get("organizationId") as string | null
    
    // Advanced QR code features
    const shape = formData.get("shape") as string
    const template = formData.get("template") as string
    const gradient = formData.get("gradient") as string
    const sticker = formData.get("sticker") as string
    const effects = formData.get("effects") as string
    const eyePattern = formData.get("eyePattern") as string

    if (!url) {
      return ApiErrors.missingField('url').toResponse()
    }

    // Use original URL directly (URL shortening disabled for now)
    const originalUrl = url

    let logoUrl = null
    if (logoFile && logoFile.size > 0) {
      try {
        // Validate file type on server side
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
        if (!allowedTypes.includes(logoFile.type)) {
          return ApiErrors.invalidFileType(allowedTypes).toResponse()
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB in bytes
        if (logoFile.size > maxSize) {
          return ApiErrors.fileTooLarge('5MB').toResponse()
        }
        
        // Create a unique filename
        const timestamp = Date.now()
        const sanitizedFileName = logoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}-${sanitizedFileName}`
        
        // Convert File to Buffer and optimize
        const bytes = await logoFile.arrayBuffer()
        let buffer: Buffer = Buffer.from(new Uint8Array(bytes))
        
        // Optimize image if optimization utility is available
        try {
          const { optimizeImage } = await import('@/lib/image-optimization')
          buffer = await optimizeImage(buffer, {
            maxWidth: 512,
            maxHeight: 512,
            quality: 85,
            format: 'webp',
          })
        } catch (error) {
          console.warn('Image optimization not available, using original:', error)
          // Continue with original buffer
        }
        
        // Ensure bucket exists (auto-create if missing)
        try {
          const storageAny = (supabaseAdmin as { storage?: { listBuckets?: () => Promise<{ data?: Array<{ name?: string; id?: string }> }>; createBucket?: (name: string, options: { public: boolean }) => Promise<unknown> } }).storage
          const { data: buckets } = await storageAny?.listBuckets?.() || { data: undefined }
          const bucketExists = Array.isArray(buckets) && buckets.some((b: { name?: string; id?: string }) => b.name === 'qr-logos' || b.id === 'qr-logos')
          if (!bucketExists && storageAny?.createBucket) {
            await storageAny.createBucket('qr-logos', { public: true })
          }
        } catch (bucketCheckErr) {
          console.warn('Bucket check/create failed (proceeding to upload):', bucketCheckErr)
        }

        // Upload to Supabase Storage
        let uploadError: Error | null = null
        const { error: initialError } = await supabaseAdmin!
          .storage
          .from('qr-logos')
          .upload(fileName, buffer, {
            contentType: logoFile.type,
            upsert: false
          })

        if (initialError) {
          uploadError = initialError

          // If bucket was missing and upload failed, try to create and retry once
          if ((uploadError as { status?: number }).status === 400) {
            try {
              const storageAny = (supabaseAdmin as { storage?: { createBucket?: (name: string, options: { public: boolean }) => Promise<unknown> } }).storage
              if (storageAny?.createBucket) {
                await storageAny.createBucket('qr-logos', { public: true })
                const retry = await supabaseAdmin!.storage.from('qr-logos').upload(fileName, buffer, {
                  contentType: logoFile.type,
                  upsert: false,
                })
                uploadError = retry.error
              }
            } catch (retryErr) {
              console.warn('Retry after bucket create failed:', retryErr)
            }
          }
        }

        if (uploadError) {
          console.error("Error uploading to Supabase Storage:", uploadError)
          return ApiErrors.externalServiceError('Supabase Storage', uploadError).toResponse()
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
    const insertData: Record<string, unknown> = {
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

    // Enforce dynamic QR entitlement
    if (insertData.isDynamic) {
      const plan = await getUserPlan(session.user.id)
      if (!hasFeature(plan, 'dynamicQrAllowed')) {
        return NextResponse.json(
          { error: 'feature_not_allowed', message: 'Dynamic QR codes are not available on your plan.' },
          { status: 403 }
        )
      }
    }

    // Validate organization access if organizationId provided
    if (organizationId) {
      const hasAccess = await canAccessOrgResource(session.user.id, organizationId)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Not a member of this organization' },
          { status: 403 }
        )
      }
      insertData.organizationId = organizationId
    }

    // Use atomic transaction function to create QR code and deduct credit
    // This ensures both operations succeed or both fail - no data inconsistency
    console.log("Calling atomic transaction function...")
    
    const { data: result, error } = await supabaseAdmin!
      .rpc('create_qr_code_with_credit_deduction', {
        p_qr_data: insertData,
        p_user_id: session.user.id
      })

    if (error) {
      console.error("Transaction error details:", error)
      
      // Handle specific error cases
      if (error.message?.includes('Insufficient credits')) {
        return ApiErrors.insufficientCredits().toResponse()
      }
      
      if (error.message?.includes('User not found')) {
        return ApiErrors.userNotFound(session.user.id).toResponse()
      }
      
      return ApiErrors.databaseError('Failed to create QR code', error.message).toResponse()
    }
    
    const qrCode = result as Record<string, unknown>
    console.log("QR code created successfully with atomic transaction:", qrCode)

    // Invalidate caches after successful creation
    await Promise.all([
      UserCreditsCache.invalidate(session.user.id), // Credits changed
      QRCodeCache.invalidateUserList(session.user.id), // QR list changed
    ])

    return createdResponse(qrCode)
  } catch (error) {
    console.error("=== CRITICAL ERROR in QR Code API ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("Full error object:", error)
    return handleApiError(error)
  }
}

export async function GET() {
  try {
    // Add timeout handling
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    )

    const sessionPromise = getServerSession(authOptions)
    const session = await Promise.race([sessionPromise, timeoutPromise]) as { user?: { id: string } } | null
    
    if (!session?.user?.id) {
      return ApiErrors.unauthorized().toResponse()
    }

    // Get user's organization IDs
    const { data: orgMembers } = await supabaseAdmin!
      .from('OrganizationMember')
      .select('organizationId')
      .eq('userId', session.user.id)
    
    const orgIds = orgMembers?.map(m => m.organizationId) || []
    
    // Fetch QR codes: user-owned OR org-owned (where user is member)
    const { data: qrCodes, error } = await supabaseAdmin!
      .from('QrCode')
      .select('*')
      .or(`userId.eq.${session.user.id}${orgIds.length > 0 ? `,organizationId.in.(${orgIds.join(',')})` : ''}`)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error("Error fetching QR codes:", error)
      return ApiErrors.databaseError('Failed to fetch QR codes', error).toResponse()
    }

    return NextResponse.json(qrCodes || [])
  } catch (error) {
    console.error("Error fetching QR codes:", error)
    return handleApiError(error)
  }
}
