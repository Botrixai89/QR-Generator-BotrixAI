import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

// Bulk QR code operations
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
    const { 
      operation, // 'create', 'update', 'delete', 'export'
      qrCodes, // Array of QR code data
      groupName
    } = body

    // Validate operation type
    const validOperations = ['create', 'update', 'delete', 'export']
    if (!validOperations.includes(operation)) {
      return NextResponse.json(
        { error: "Invalid operation type" },
        { status: 400 }
      )
    }

    // Create bulk group record
    const { data: bulkGroup, error: bulkError } = await supabaseAdmin!
      .from('QrCodeBulkGroup')
      .insert({
        userId: session.user.id,
        groupName: groupName || `Bulk ${operation} - ${new Date().toISOString()}`,
        operationType: operation,
        totalCount: qrCodes.length,
        status: 'processing'
      })
      .select()
      .single()

    if (bulkError) {
      console.error("Error creating bulk group:", bulkError)
      return NextResponse.json(
        { error: "Failed to create bulk operation" },
        { status: 500 }
      )
    }

    // Process bulk operation asynchronously
    processBulkOperation(bulkGroup.id, operation, qrCodes, session.user.id)

    return NextResponse.json({
      success: true,
      bulkGroupId: bulkGroup.id,
      message: `Bulk ${operation} operation started`
    })
  } catch (error) {
    console.error("Error processing bulk operation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Get bulk operation status
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
    const bulkGroupId = searchParams.get('bulkGroupId')

    if (bulkGroupId) {
      // Get specific bulk group
      const { data: bulkGroup, error } = await supabaseAdmin!
        .from('QrCodeBulkGroup')
        .select('*')
        .eq('id', bulkGroupId)
        .eq('userId', session.user.id)
        .single()

      if (error) {
        return NextResponse.json(
          { error: "Bulk group not found" },
          { status: 404 }
        )
      }

      return NextResponse.json(bulkGroup)
    } else {
      // Get all bulk groups for user
      const { data: bulkGroups, error } = await supabaseAdmin!
        .from('QrCodeBulkGroup')
        .select('*')
        .eq('userId', session.user.id)
        .order('createdAt', { ascending: false })
        .limit(50)

      if (error) {
        console.error("Error fetching bulk groups:", error)
        return NextResponse.json(
          { error: "Failed to fetch bulk operations" },
          { status: 500 }
        )
      }

      return NextResponse.json(bulkGroups)
    }
  } catch (error) {
    console.error("Error fetching bulk operations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Process bulk operation asynchronously
async function processBulkOperation(
  bulkGroupId: string, 
  operation: string, 
  qrCodes: Array<Record<string, unknown>>, 
  userId: string
) {
  const results = {
    successful: [] as Array<Record<string, unknown>>,
    failed: [] as Array<Record<string, unknown>>,
    errors: [] as Array<{ qrCode: Record<string, unknown>; error: string }>
  }

  let processedCount = 0
  let failedCount = 0

  try {
    // Handle bulk create with atomic transaction
    if (operation === 'create') {
      try {
        // Use atomic transaction for all QR codes at once
        const { data: bulkResult, error: bulkError } = await supabaseAdmin!
          .rpc('bulk_create_qr_codes_with_credits', {
            p_qr_data_array: qrCodes,
            p_user_id: userId
          })

        if (bulkError) {
          throw new Error(bulkError.message)
        }

        const createdQRCodes = bulkResult as Array<Record<string, unknown>>
        results.successful = createdQRCodes
        processedCount = createdQRCodes.length
        
        // Update final status
        await supabaseAdmin!
          .from('QrCodeBulkGroup')
          .update({
            status: 'completed',
            completedAt: new Date().toISOString(),
            processedCount,
            failedCount: 0,
            results
          })
          .eq('id', bulkGroupId)
        
        return
      } catch (error) {
        // Handle bulk creation failure
        results.errors.push({
          qrCode: { operation: 'bulk_create' },
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        failedCount = qrCodes.length
        
        await supabaseAdmin!
          .from('QrCodeBulkGroup')
          .update({
            status: 'failed',
            completedAt: new Date().toISOString(),
            processedCount: 0,
            failedCount,
            results
          })
          .eq('id', bulkGroupId)
        
        return
      }
    }
    
    // Handle other operations one by one
    for (const qrCodeData of qrCodes) {
      try {
        let result = null

        switch (operation) {
          case 'create':
            // This case is already handled above
            break
          case 'update': {
            if (typeof qrCodeData.id !== 'string') {
              throw new Error('QR code id is required for update operation')
            }
            result = await updateBulkQRCode(qrCodeData as Record<string, unknown> & { id: string }, userId)
            break
          }
          case 'delete': {
            if (typeof qrCodeData.id !== 'string') {
              throw new Error('QR code id is required for delete operation')
            }
            result = await deleteBulkQRCode(qrCodeData.id, userId)
            break
          }
          case 'export': {
            if (typeof qrCodeData.id !== 'string') {
              throw new Error('QR code id is required for export operation')
            }
            result = await exportBulkQRCode(qrCodeData as Record<string, unknown> & { id: string }, userId)
            break
          }
        }

        if (result) {
          results.successful.push(result)
          processedCount++
        } else {
          results.failed.push(qrCodeData)
          failedCount++
        }
      } catch (error) {
        results.failed.push(qrCodeData)
        results.errors.push({
          qrCode: qrCodeData,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        failedCount++
      }

      // Update progress
      await supabaseAdmin!
        .from('QrCodeBulkGroup')
        .update({
          processedCount,
          failedCount,
          results
        })
        .eq('id', bulkGroupId)
    }

    // Mark as completed
    await supabaseAdmin!
      .from('QrCodeBulkGroup')
      .update({
        status: 'completed',
        completedAt: new Date().toISOString(),
        processedCount,
        failedCount,
        results
      })
      .eq('id', bulkGroupId)

  } catch {
    // Mark as failed
    await supabaseAdmin!
      .from('QrCodeBulkGroup')
      .update({
        status: 'failed',
        completedAt: new Date().toISOString(),
        processedCount,
        failedCount,
        results
      })
      .eq('id', bulkGroupId)
  }
}

// Note: Bulk create now uses atomic transaction function
// See: bulk_create_qr_codes_with_credits in migrations/20250111_atomic_qr_creation.sql

// Bulk update QR codes
async function updateBulkQRCode(qrCodeData: Record<string, unknown> & { id: string }, userId: string) {
  const { data: qrCode, error } = await supabaseAdmin!
    .from('QrCode')
    .update({
      title: qrCodeData.title,
      url: qrCodeData.url,
      dynamicContent: qrCodeData.dynamicContent,
      redirectUrl: qrCodeData.redirectUrl,
      expiresAt: qrCodeData.expiresAt,
      maxScans: qrCodeData.maxScans,
      foregroundColor: qrCodeData.foregroundColor,
      backgroundColor: qrCodeData.backgroundColor,
      dotType: qrCodeData.dotType,
      cornerType: qrCodeData.cornerType,
      hasWatermark: qrCodeData.hasWatermark,
      deviceRedirection: qrCodeData.deviceRedirection,
      geoRedirection: qrCodeData.geoRedirection,
      marketingPixels: qrCodeData.marketingPixels,
      abTestConfig: qrCodeData.abTestConfig,
      webhookUrl: qrCodeData.webhookUrl,
      customDomain: qrCodeData.customDomain,
      updatedAt: new Date().toISOString()
    })
    .eq('id', qrCodeData.id)
    .eq('userId', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update QR code: ${error.message}`)
  }

  return qrCode
}

// Bulk delete QR codes
async function deleteBulkQRCode(qrCodeId: string, userId: string) {
  const { error } = await supabaseAdmin!
    .from('QrCode')
    .delete()
    .eq('id', qrCodeId)
    .eq('userId', userId)

  if (error) {
    throw new Error(`Failed to delete QR code: ${error.message}`)
  }

  return { id: qrCodeId, deleted: true }
}

// Bulk export QR codes
async function exportBulkQRCode(qrCodeData: Record<string, unknown> & { id: string }, userId: string) {
  // Get full QR code data with analytics
  const { data: qrCode, error } = await supabaseAdmin!
    .from('QrCode')
    .select(`
      *,
      QrCodeScan(*)
    `)
    .eq('id', qrCodeData.id)
    .eq('userId', userId)
    .single()

  if (error) {
    throw new Error(`Failed to export QR code: ${error.message}`)
  }

  // Calculate analytics summary
  const scans = qrCode.QrCodeScan || []
  const analytics = {
    totalScans: scans.length,
    uniqueDevices: new Set(scans.map((s: { device?: string }) => s.device)).size,
    uniqueCountries: new Set(scans.map((s: { country?: string }) => s.country).filter(Boolean)).size,
    uniqueCities: new Set(scans.map((s: { city?: string }) => s.city).filter(Boolean)).size,
    scansByDevice: scans.reduce((acc: Record<string, number>, scan: { device?: string }) => {
      acc[scan.device || 'Unknown'] = (acc[scan.device || 'Unknown'] || 0) + 1
      return acc
    }, {}),
    scansByCountry: scans.reduce((acc: Record<string, number>, scan: { country?: string }) => {
      if (scan.country) {
        acc[scan.country] = (acc[scan.country] || 0) + 1
      }
      return acc
    }, {})
  }

  return {
    ...qrCode,
    analytics,
    exportDate: new Date().toISOString()
  }
}
