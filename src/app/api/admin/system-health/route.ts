/**
 * Admin System Health API
 * Provides system health metrics for admin dashboard
 */

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * Check if user is admin
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabaseAdmin!
      .from('User')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error || !user) {
      return false
    }
    
    return user.role === 'admin'
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

/**
 * GET - Get system health metrics
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Check if user is admin
    const userIsAdmin = await isAdmin(session.user.id)
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }
    
    // Get queue depths
    const [backgroundJobs, emailQueue, webhookOutbox] = await Promise.all([
      // Background job queue depth
      supabaseAdmin!
        .from('BackgroundJob')
        .select('status', { count: 'exact', head: true })
        .in('status', ['pending', 'processing'])
        .then(({ count }) => ({ pending: count || 0, processing: 0 })),
      
      // Email queue depth
      supabaseAdmin!
        .from('EmailQueue')
        .select('status', { count: 'exact', head: true })
        .in('status', ['pending', 'processing'])
        .then(({ count }) => ({ pending: count || 0, processing: 0 })),
      
      // Webhook outbox depth
      supabaseAdmin!
        .from('WebhookOutbox')
        .select('status', { count: 'exact', head: true })
        .in('status', ['pending', 'processing'])
        .then(({ count }) => ({ pending: count || 0, processing: 0 })),
    ])
    
    // Get queue status breakdown
    const [backgroundJobStatus, emailQueueStatus, webhookOutboxStatus] = await Promise.all([
      supabaseAdmin!
        .from('BackgroundJob')
        .select('status')
        .then(({ data }) => {
          const counts = { pending: 0, processing: 0, completed: 0, failed: 0 }
          data?.forEach((job: { status: keyof typeof counts | string }) => {
            if ((job.status as string) in counts) {
              counts[job.status as keyof typeof counts]++
            }
          })
          return counts
        }),
      
      supabaseAdmin!
        .from('EmailQueue')
        .select('status')
        .then(({ data }) => {
          const counts = { pending: 0, processing: 0, sent: 0, failed: 0 }
          data?.forEach((item: { status: keyof typeof counts | string }) => {
            if ((item.status as string) in counts) {
              counts[item.status as keyof typeof counts]++
            }
          })
          return counts
        }),
      
      supabaseAdmin!
        .from('WebhookOutbox')
        .select('status')
        .then(({ data }) => {
          const counts = { pending: 0, processing: 0, delivered: 0, failed: 0 }
          data?.forEach((item: { status: keyof typeof counts | string }) => {
            if ((item.status as string) in counts) {
              counts[item.status as keyof typeof counts]++
            }
          })
          return counts
        }),
    ])
    
    // Get webhook failures (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const { count: webhookFailures24h } = await supabaseAdmin!
      .from('WebhookOutbox')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('lastAttemptAt', yesterday.toISOString())
    
    // Get domain verification status
    const { data: domains } = await supabaseAdmin!
      .from('QrCodeCustomDomain')
      .select('status, isVerified')
    
    const domainVerificationStatus = {
      total: domains?.length || 0,
      verified: domains?.filter((d: { isVerified: boolean }) => d.isVerified).length || 0,
      pending: domains?.filter((d: { isVerified: boolean; status: string }) => !d.isVerified && d.status === 'pending').length || 0,
      error: domains?.filter((d: { status: string }) => d.status === 'error').length || 0,
      active: domains?.filter((d: { status: string }) => d.status === 'active').length || 0,
    }
    
    // Get recent errors (last 24 hours)
    const { data: recentErrors } = await supabaseAdmin!
      .from('SystemLog')
      .select('level, message, timestamp')
      .in('level', ['error', 'fatal'])
      .gte('timestamp', yesterday.toISOString())
      .order('timestamp', { ascending: false })
      .limit(10)
    
    // Get system metrics (last hour)
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)
    
    const { data: recentMetrics } = await supabaseAdmin!
      .from('RequestMetric')
      .select('statusCode, responseTime')
      .gte('createdAt', oneHourAgo.toISOString())
    
    const metrics = {
      requestCount: recentMetrics?.length || 0,
      errorCount: recentMetrics?.filter((m: { statusCode: number }) => m.statusCode >= 500).length || 0,
      avgResponseTime: recentMetrics?.length
        ? recentMetrics.reduce((sum: number, m: { responseTime: number | null }) => sum + (m.responseTime || 0), 0) / recentMetrics.length
        : 0,
    }
    
    return NextResponse.json({
      queues: {
        backgroundJobs: {
          depth: backgroundJobs.pending + backgroundJobs.processing,
          ...backgroundJobStatus,
        },
        emailQueue: {
          depth: emailQueue.pending + emailQueue.processing,
          ...emailQueueStatus,
        },
        webhookOutbox: {
          depth: webhookOutbox.pending + webhookOutbox.processing,
          ...webhookOutboxStatus,
          failures24h: webhookFailures24h || 0,
        },
      },
      domainVerification: domainVerificationStatus,
      recentErrors: recentErrors || [],
      metrics,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching system health:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

