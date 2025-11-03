/**
 * Background Job System
 * Handles heavy tasks asynchronously (bulk QR, export, webhook retries)
 */

import { supabaseAdmin } from "@/lib/supabase"
import { retryWithTimeout } from "./retry-with-timeout"

export type JobType = 
  | 'bulk_qr_create'
  | 'bulk_qr_update'
  | 'qr_export'
  | 'webhook_retry'
  | 'analytics_aggregate'
  | 'image_optimization'

export interface BackgroundJob {
  id: string
  jobType: JobType
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: number
  payload: any
  result?: any
  error?: string
  retries: number
  maxRetries: number
  runAfter: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * Create a background job
 */
export async function createBackgroundJob(
  jobType: JobType,
  payload: any,
  options: {
    priority?: number
    maxRetries?: number
    runAfter?: Date
  } = {}
): Promise<BackgroundJob> {
  const { data: job, error } = await supabaseAdmin!
    .from('BackgroundJob')
    .insert({
      jobType,
      payload,
      priority: options.priority || 0,
      maxRetries: options.maxRetries || 3,
      runAfter: options.runAfter?.toISOString() || new Date().toISOString(),
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create background job: ${error.message}`)
  }

  return job
}

/**
 * Get next job to process
 */
export async function getNextBackgroundJob(): Promise<BackgroundJob | null> {
  const { data, error } = await supabaseAdmin!
    .rpc('get_next_background_job')

  if (error) {
    console.error('Error getting next background job:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  // Get full job details
  const { data: job, error: jobError } = await supabaseAdmin!
    .from('BackgroundJob')
    .select('*')
    .eq('id', data[0].id)
    .single()

  if (jobError || !job) {
    return null
  }

  // Update status to processing
  await supabaseAdmin!
    .from('BackgroundJob')
    .update({
      status: 'processing',
      startedAt: new Date().toISOString(),
    })
    .eq('id', job.id)

  return job
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: string,
  status: 'completed' | 'failed',
  result?: any,
  error?: string
): Promise<void> {
  const updateData: any = {
    status,
    updatedAt: new Date().toISOString(),
  }

  if (status === 'completed') {
    updateData.completedAt = new Date().toISOString()
    updateData.result = result
  }

  if (status === 'failed') {
    updateData.error = error
    updateData.retries = supabaseAdmin!.raw('retries + 1')
  }

  const { error: updateError } = await supabaseAdmin!
    .from('BackgroundJob')
    .update(updateData)
    .eq('id', jobId)

  if (updateError) {
    console.error('Error updating job status:', updateError)
  }
}

/**
 * Process background job
 */
export async function processBackgroundJob<T>(
  job: BackgroundJob,
  processor: (payload: any) => Promise<T>
): Promise<T | null> {
  try {
    // Update status to processing
    await updateJobStatus(job.id, 'processing')

    // Process job with retry logic
    const result = await retryWithTimeout(
      () => processor(job.payload),
      {
        maxRetries: job.maxRetries,
        timeout: 300000, // 5 minutes for background jobs
      }
    )

    // Update status to completed
    await updateJobStatus(job.id, 'completed', result)

    return result
  } catch (error) {
    // Update status to failed
    await updateJobStatus(
      job.id,
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    )

    // Retry job if retries available
    if (job.retries < job.maxRetries) {
      await supabaseAdmin!
        .from('BackgroundJob')
        .update({
          status: 'pending',
          retries: job.retries + 1,
          runAfter: new Date(Date.now() + 60000 * (job.retries + 1)).toISOString(), // Exponential backoff
        })
        .eq('id', job.id)
    }

    throw error
  }
}

