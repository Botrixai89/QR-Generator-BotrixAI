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

    const formData = await request.formData()
    const rawUrl = formData.get("url")
    const url = typeof rawUrl === "string" ? rawUrl : rawUrl != null ? String(rawUrl) : ""
    const titleField = formData.get("title")
    const title = typeof titleField === "string" ? titleField : titleField != null ? String(titleField) : ""
    const foregroundColor =
      String(formData.get("foregroundColor") ?? "").trim() || "#000000"
    const backgroundColor =
      String(formData.get("backgroundColor") ?? "").trim() || "#FFFFFF"
    const dotType = String(formData.get("dotType") ?? "").trim() || "square"
    const cornerType = String(formData.get("cornerType") ?? "").trim() || "square"
    const hasWatermark = formData.get("hasWatermark") === "true"
    const logoFile = formData.get("logo") as File | null
    const isDynamic = formData.get("isDynamic") === "true"
    const dynamicContent = formData.get("dynamicContent") as string
    const expiresAt = formData.get("expiresAt") as string
    const maxScansRaw = formData.get("maxScans")
    const maxScans = typeof maxScansRaw === "string" ? maxScansRaw : maxScansRaw != null ? String(maxScansRaw) : ""
    const redirectUrl = formData.get("redirectUrl") as string
    const organizationId = formData.get("organizationId") as string | null
    const folderId = formData.get("folderId") as string | null
    const fileId = formData.get("fileId") as string | null

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
    if (maxScans) {
      const n = parseInt(maxScans, 10)
      if (Number.isFinite(n)) insertData.maxScans = n
    }
    if (redirectUrl) insertData.redirectUrl = redirectUrl

    // Add advanced features
    if (shape) insertData.shape = shape
    if (template) insertData.template = template
    if (eyePattern) insertData.eyePattern = eyePattern
    if (parsedGradient) insertData.gradient = parsedGradient
    if (parsedSticker) insertData.sticker = parsedSticker
    if (parsedEffects) insertData.effects = parsedEffects

    // Resolve plan once for all entitlement and credit logic
    const userPlan = await getUserPlan(session.user.id)

    // Enforce dynamic QR entitlement
    if (insertData.isDynamic) {
      if (!hasFeature(userPlan, 'dynamicQrAllowed')) {
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

    // Validate folder access if folderId provided
    if (folderId) {
      const { data: folder } = await supabaseAdmin!
        .from('QrCodeFolder')
        .select('id')
        .eq('id', folderId)
        .eq('userId', session.user.id)
        .single()

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found or access denied' },
          { status: 404 }
        )
      }
      insertData.folderId = folderId
    }

    // Validate file access if fileId provided
    if (fileId) {
      const { data: file } = await supabaseAdmin!
        .from('QrCodeFile')
        .select('id, publicUrl')
        .eq('id', fileId)
        .eq('userId', session.user.id)
        .single()

      if (!file) {
        return NextResponse.json(
          { error: 'File not found or access denied' },
          { status: 404 }
        )
      }
      insertData.fileId = fileId
      // If URL is not provided and file is provided, use file URL
      if (!originalUrl || originalUrl.trim() === '') {
        insertData.url = file.publicUrl
      }
    }

    // Enforce plan QR-code limits before creation
    try {
      await assertCanCreateQr(session.user.id)
    } catch (error) {
      const status = (error as { status?: number }).status
      const code = (error as { code?: string }).code
      const message = error instanceof Error ? error.message : 'Plan limit reached'
      if (status === 403 && code === 'PLAN_LIMIT_QR_CODES') {
        return NextResponse.json(
          { error: code, message },
          { status: 403 }
        )
      }
      throw error
    }

    // Ensure user row exists and load credits in one round-trip
    const { data: userRow, error: userLookupError } = await supabaseAdmin!
      .from('User')
      .select('id, credits')
      .eq('id', session.user.id)
      .maybeSingle()

    if (userLookupError) {
      return ApiErrors.databaseError('Failed to verify user', userLookupError.message).toResponse()
    }
    if (!userRow) {
      return ApiErrors.unauthorized(
        'Your account was not found. Please sign out and sign in again.'
      ).toResponse()
    }


    console.log("Inserting QR code into database...")

    // Drop undefined keys — PostgREST can reject payloads with undefined values
    const insertPayload = Object.fromEntries(
      Object.entries(insertData).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>

    // We need to type the result correctly
    const { data: result, error } = await supabaseAdmin!
      .from('QrCode')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error("Database insert error details:", error)
      return ApiErrors.databaseError('Failed to create QR code', error.message).toResponse()
    }

    const qrCode = result as Record<string, unknown>
    console.log("QR code created successfully:", qrCode)


    // Invalidate caches after successful creation
    await Promise.all([
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
