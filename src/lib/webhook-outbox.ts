/**
 * Webhook Outbox Pattern Implementation
 * Guarantees webhook delivery with retry logic
 */

import { supabaseAdmin } from "@/lib/supabase"
import { retryWithTimeout } from "./retry-with-timeout"
import crypto from 'crypto'

export interface WebhookOutbox {
  id: string
  qrCodeId: string
  webhookUrl: string
  payload: any
  secret?: string
  status: 'pending' | 'processing' | 'delivered' | 'failed'
  attempts: number
  maxAttempts: number
  nextRetryAt: string
  lastAttemptAt?: string
  lastError?: string
  deliveredAt?: string
  responseStatus?: number
  responseBody?: string
  createdAt: string
  updatedAt: string
}

/**
 * Add webhook to outbox
 */
export async function addWebhookToOutbox(
  qrCodeId: string,
  webhookUrl: string,
  payload: any,
  secret?: string
): Promise<WebhookOutbox> {
  const { data: outbox, error } = await supabaseAdmin!
    .from('WebhookOutbox')
    .insert({
      qrCodeId,
      webhookUrl,
      payload,
      secret,
      status: 'pending',
      attempts: 0,
      maxAttempts: 5,
      nextRetryAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add webhook to outbox: ${error.message}`)
  }

  return outbox
}

/**
 * Get next webhooks to process
 */
export async function getNextWebhookRetries(limit: number = 10): Promise<WebhookOutbox[]> {
  const { data, error } = await supabaseAdmin!
    .rpc('get_next_webhook_retry')

  if (error) {
    console.error('Error getting next webhook retries:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // Get full outbox details
  const ids = data.map((item: any) => item.id)
  const { data: outboxes, error: outboxError } = await supabaseAdmin!
    .from('WebhookOutbox')
    .select('*')
    .in('id', ids)
    .limit(limit)

  if (outboxError || !outboxes) {
    return []
  }

  return outboxes
}

/**
 * Generate webhook signature
 */
function generateWebhookSignature(payload: any, secret: string): string {
  const payloadString = JSON.stringify(payload)
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex')
  return signature
}

/**
 * Deliver webhook
 */
export async function deliverWebhook(outbox: WebhookOutbox): Promise<boolean> {
  try {
    // Update status to processing
    await supabaseAdmin!
      .from('WebhookOutbox')
      .update({
        status: 'processing',
        lastAttemptAt: new Date().toISOString(),
        attempts: outbox.attempts + 1,
      })
      .eq('id', outbox.id)

    // Generate signature if secret provided
    const signature = outbox.secret
      ? generateWebhookSignature(outbox.payload, outbox.secret)
      : null

    // Deliver webhook with retry and timeout
    const response = await retryWithTimeout(
      async () => {
        const fetchResponse = await fetch(outbox.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(signature && { 'X-Webhook-Signature': signature }),
            'User-Agent': 'QR-Generator-Webhook/1.0',
          },
          body: JSON.stringify(outbox.payload),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        })

        if (!response.ok) {
          throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`)
        }

        return response
      },
      {
        maxRetries: 2, // Quick retry for transient errors
        timeout: 30000, // 30 seconds
      }
    )

    const responseBody = await response.text()

    // Update status to delivered
    await supabaseAdmin!
      .rpc('update_webhook_outbox_status', {
        outbox_id: outbox.id,
        new_status: 'delivered',
        response_status: response.status,
        response_body: responseBody,
      })

    return true
  } catch (error) {
    // Update status to failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    await supabaseAdmin!
      .rpc('update_webhook_outbox_status', {
        outbox_id: outbox.id,
        new_status: 'failed',
        error_message: errorMessage,
      })

    return false
  }
}

/**
 * Process webhook outbox (should be called by background job)
 */
export async function processWebhookOutbox(): Promise<void> {
  const webhooks = await getNextWebhookRetries(10)

  const deliveryPromises = webhooks.map(outbox => deliverWebhook(outbox))
  await Promise.allSettled(deliveryPromises)
}

/**
 * Get webhook outbox status for QR code
 */
export async function getWebhookOutboxStatus(
  qrCodeId: string
): Promise<{
  pending: number
  failed: number
  delivered: number
  total: number
}> {
  const { data: outboxes, error } = await supabaseAdmin!
    .from('WebhookOutbox')
    .select('status')
    .eq('qrCodeId', qrCodeId)

  if (error || !outboxes) {
    return { pending: 0, failed: 0, delivered: 0, total: 0 }
  }

  const statusCounts = outboxes.reduce(
    (acc, outbox) => {
      acc.total++
      acc[outbox.status as keyof typeof acc]++
      return acc
    },
    { pending: 0, failed: 0, delivered: 0, total: 0 }
  )

  return statusCounts
}

