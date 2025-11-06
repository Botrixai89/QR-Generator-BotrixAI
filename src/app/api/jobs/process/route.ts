import { NextRequest, NextResponse } from "next/server"
import { getNextBackgroundJob, processBackgroundJob } from "@/lib/background-jobs"
import { processWebhookOutbox } from "@/lib/webhook-outbox"
import { supabaseAdmin } from "@/lib/supabase"
// crypto not used here

/**
 * POST - Process background jobs
 * Should be called by cron job or worker
 */
export async function POST(request: NextRequest) {
  try {
    // Verify request is from cron job (in production, verify secret)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { jobType, limit = 10 } = body

    const processed: string[] = []

    if (jobType === 'webhook' || !jobType) {
      // Process webhook outbox
      await processWebhookOutbox()
      processed.push('webhook_outbox')
    }

    if (jobType === 'background' || !jobType) {
      // Process background jobs
      let processedCount = 0
      
      while (processedCount < limit) {
        const job = await getNextBackgroundJob()
        
        if (!job) {
          break
        }

        try {
          await processBackgroundJob(job, async (payload) => {
            switch (job.jobType) {
              case 'bulk_qr_create':
                return await processBulkQRCreate(payload as BulkQrCreatePayload)
              case 'bulk_qr_update':
                return await processBulkQRUpdate(payload as BulkQrUpdatePayload)
              case 'qr_export':
                return await processQRExport(payload as QrExportPayload)
              case 'webhook_retry':
                return await processWebhookRetry(payload)
              case 'analytics_aggregate':
                return await processAnalyticsAggregate(payload as AnalyticsAggregatePayload)
              case 'image_optimization':
                return await processImageOptimization(payload as ImageOptimizationPayload)
              default:
                throw new Error(`Unknown job type: ${job.jobType}`)
            }
          })
          
          processed.push(job.id)
          processedCount++
        } catch (error) {
          console.error(`Error processing job ${job.id}:`, error)
          // Continue processing other jobs
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      count: processed.length,
    })
  } catch (error) {
    console.error("Error processing jobs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Job processors
type BulkQrCreatePayload = { userId: string; qrCodes: Array<Record<string, unknown>> }
async function processBulkQRCreate(payload: BulkQrCreatePayload) {
  const { userId, qrCodes } = payload

  const results = []
  for (const qrData of qrCodes) {
    const { data, error } = await supabaseAdmin!
      .from('QrCode')
      .insert({
        ...qrData,
        userId,
      })
      .select()
      .single()

    if (error) {
      results.push({ error: error.message, data: qrData })
    } else {
      results.push({ success: true, id: data.id })
    }
  }

  return results
}

type BulkQrUpdatePayload = { updates: Array<Record<string, unknown> & { id: string }> }
async function processBulkQRUpdate(payload: BulkQrUpdatePayload) {
  const { updates } = payload

  const results = []
  for (const update of updates) {
    const { id, ...data } = update
    const { error } = await supabaseAdmin!
      .from('QrCode')
      .update(data)
      .eq('id', id)

    if (error) {
      results.push({ error: error.message, id })
    } else {
      results.push({ success: true, id })
    }
  }

  return results
}

type QrExportPayload = { userId: string; format: string; filters?: Record<string, unknown> }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function processQRExport(_payload: QrExportPayload) {
  
  // Generate export file (implement based on format)
  // For now, return success
  return { success: true, fileUrl: null }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function processWebhookRetry(_payload: unknown) {
  // Webhook retry is handled by processWebhookOutbox
  return { success: true }
}

type AnalyticsAggregatePayload = { date: string }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function processAnalyticsAggregate(_payload: AnalyticsAggregatePayload) {
  
  // Aggregate analytics for date
  // Implementation depends on analytics structure
  return { success: true }
}

type ImageOptimizationPayload = { imageUrl: string; options?: Record<string, unknown> }
async function processImageOptimization(payload: ImageOptimizationPayload) {
  const { imageUrl } = payload
  
  // Optimize image (implement using image optimization utilities)
  // For now, return success
  return { success: true, optimizedUrl: imageUrl }
}

