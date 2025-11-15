import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { getUserPlan } from "@/lib/entitlements"
import { getEntitlements } from "@/lib/entitlements"

/**
 * GET - List all files for the authenticated user
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
    const qrCodeId = searchParams.get('qrCodeId') // Optional: filter by QR code

    let query = supabaseAdmin!
      .from('QrCodeFile')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })

    if (qrCodeId) {
      query = query.eq('qrCodeId', qrCodeId)
    }

    const { data: files, error } = await query

    if (error) {
      console.error("Error fetching files:", error)
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      )
    }

    // Get user's storage usage
    const { data: usageData } = await supabaseAdmin!
      .rpc('get_user_file_storage_usage', { p_user_id: session.user.id })

    const plan = await getUserPlan(session.user.id)
    const entitlements = getEntitlements(plan)

    return NextResponse.json({
      files: files || [],
      storageUsage: {
        usedBytes: usageData || 0,
        usedMB: Math.round((usageData || 0) / (1024 * 1024) * 100) / 100,
        limitMB: entitlements.fileStorageMB,
        limitBytes: entitlements.fileStorageMB * 1024 * 1024
      }
    })
  } catch (error) {
    console.error("Error in GET /api/files:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST - Upload a file
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

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const qrCodeId = formData.get('qrCodeId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Check file size (max 50MB per file)
    const maxFileSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      )
    }

    // Check user's storage quota
    const plan = await getUserPlan(session.user.id)
    const { data: canUpload } = await supabaseAdmin!
      .rpc('can_user_upload_file', {
        p_user_id: session.user.id,
        p_file_size: file.size,
        p_plan: plan
      })

    if (!canUpload) {
      const entitlements = getEntitlements(plan)
      return NextResponse.json(
        { 
          error: `Storage limit exceeded. Your plan includes ${entitlements.fileStorageMB} MB of storage.`,
          code: 'STORAGE_LIMIT_EXCEEDED'
        },
        { status: 403 }
      )
    }

    // Validate QR code if provided
    if (qrCodeId) {
      const { data: qrCode } = await supabaseAdmin!
        .from('QrCode')
        .select('id')
        .eq('id', qrCodeId)
        .eq('userId', session.user.id)
        .single()

      if (!qrCode) {
        return NextResponse.json(
          { error: "QR code not found" },
          { status: 404 }
        )
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${session.user.id}/${timestamp}-${sanitizedFileName}`

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin!
      .storage
      .from('qr-files')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError || !uploadData) {
      console.error("Error uploading file:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin!
      .storage
      .from('qr-files')
      .getPublicUrl(fileName)

    // Create file record
    const { data: fileRecord, error: dbError } = await supabaseAdmin!
      .from('QrCodeFile')
      .insert({
        userId: session.user.id,
        qrCodeId: qrCodeId || null,
        name: sanitizedFileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        storagePath: fileName,
        publicUrl: urlData.publicUrl
      })
      .select()
      .single()

    if (dbError) {
      console.error("Error creating file record:", dbError)
      // Try to delete uploaded file
      await supabaseAdmin!.storage.from('qr-files').remove([fileName])
      return NextResponse.json(
        { error: "Failed to create file record" },
        { status: 500 }
      )
    }

    return NextResponse.json({ file: fileRecord }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/files:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

