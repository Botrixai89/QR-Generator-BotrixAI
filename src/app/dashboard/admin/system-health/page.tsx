/**
 * Admin System Health Page
 * Displays system health metrics, queue depths, webhook failures, and domain verification status
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Activity,
  AlertTriangle,
  Database,
  Globe,
  Mail,
  RefreshCw,
  Webhook,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface QueueStatus {
  depth: number
  pending: number
  processing: number
  completed?: number
  failed: number
  delivered?: number
  sent?: number
  failures24h?: number
}

interface SystemHealth {
  queues: {
    backgroundJobs: QueueStatus
    emailQueue: QueueStatus
    webhookOutbox: QueueStatus
  }
  domainVerification: {
    total: number
    verified: number
    pending: number
    error: number
    active: number
  }
  recentErrors: Array<{
    level: string
    message: string
    timestamp: string
  }>
  metrics: {
    requestCount: number
    errorCount: number
    avgResponseTime: number
  }
  timestamp: string
}

export default function SystemHealthPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHealth = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    
    try {
      const response = await fetch('/api/admin/system-health')
      
      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Access denied - Admin access required')
          router.push('/dashboard')
          return
        }
        throw new Error('Failed to fetch system health')
      }
      
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      console.error('Error fetching system health:', error)
      toast.error('Failed to load system health')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session) {
      void fetchHealth()

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        void fetchHealth(true)
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [status, session, router, fetchHealth])

  if (status === 'loading' || !session || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading system health...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!health) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No system health data available
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getQueueStatusColor = (depth: number) => {
    if (depth === 0) return 'bg-green-500'
    if (depth < 10) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Removed unused getStatusBadge helper

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">System Health</h1>
          <p className="text-muted-foreground">
            Monitor queue depths, webhook failures, and domain verification status
          </p>
        </div>
        <Button
          onClick={() => fetchHealth()}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Queue Depths */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Background Jobs
            </CardTitle>
            <CardDescription>Job queue status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Queue Depth</span>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${getQueueStatusColor(health.queues.backgroundJobs.depth)}`} />
                  <span className="font-semibold">{health.queues.backgroundJobs.depth}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Pending:</span> {health.queues.backgroundJobs.pending}
                </div>
                <div>
                  <span className="text-muted-foreground">Processing:</span> {health.queues.backgroundJobs.processing}
                </div>
                <div>
                  <span className="text-muted-foreground">Completed:</span> {health.queues.backgroundJobs.completed || 0}
                </div>
                <div>
                  <span className="text-muted-foreground">Failed:</span> {health.queues.backgroundJobs.failed}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Queue
            </CardTitle>
            <CardDescription>Email sending queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Queue Depth</span>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${getQueueStatusColor(health.queues.emailQueue.depth)}`} />
                  <span className="font-semibold">{health.queues.emailQueue.depth}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Pending:</span> {health.queues.emailQueue.pending}
                </div>
                <div>
                  <span className="text-muted-foreground">Processing:</span> {health.queues.emailQueue.processing}
                </div>
                <div>
                  <span className="text-muted-foreground">Sent:</span> {health.queues.emailQueue.sent || 0}
                </div>
                <div>
                  <span className="text-muted-foreground">Failed:</span> {health.queues.emailQueue.failed}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Outbox
            </CardTitle>
            <CardDescription>Webhook delivery queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Queue Depth</span>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${getQueueStatusColor(health.queues.webhookOutbox.depth)}`} />
                  <span className="font-semibold">{health.queues.webhookOutbox.depth}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Pending:</span> {health.queues.webhookOutbox.pending}
                </div>
                <div>
                  <span className="text-muted-foreground">Processing:</span> {health.queues.webhookOutbox.processing}
                </div>
                <div>
                  <span className="text-muted-foreground">Delivered:</span> {health.queues.webhookOutbox.delivered || 0}
                </div>
                <div>
                  <span className="text-muted-foreground">Failed:</span> {health.queues.webhookOutbox.failed}
                </div>
              </div>
              {health.queues.webhookOutbox.failures24h !== undefined && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Failures (24h)</span>
                    <span className={`font-semibold ${health.queues.webhookOutbox.failures24h > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {health.queues.webhookOutbox.failures24h}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Verification Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Verification Status
          </CardTitle>
          <CardDescription>Custom domain verification overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{health.domainVerification.total}</div>
              <div className="text-sm text-muted-foreground">Total Domains</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{health.domainVerification.verified}</div>
              <div className="text-sm text-green-600">Verified</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{health.domainVerification.pending}</div>
              <div className="text-sm text-yellow-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">{health.domainVerification.error}</div>
              <div className="text-sm text-red-600">Error</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{health.domainVerification.active}</div>
              <div className="text-sm text-blue-600">Active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Metrics (Last Hour)
          </CardTitle>
          <CardDescription>Request and error metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Request Count</div>
              <div className="text-2xl font-bold">{health.metrics.requestCount.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Error Count</div>
              <div className={`text-2xl font-bold ${health.metrics.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {health.metrics.errorCount.toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Avg Response Time</div>
              <div className="text-2xl font-bold">{Math.round(health.metrics.avgResponseTime)}ms</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {health.recentErrors && health.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Recent Errors (Last 24 Hours)
            </CardTitle>
            <CardDescription>Error and fatal level logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.recentErrors.map((error, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {error.level === 'fatal' ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-semibold text-red-700 uppercase text-xs">
                        {error.level}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(error.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-red-800">{error.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Last updated: {new Date(health.timestamp).toLocaleString()}
      </div>
    </div>
  )
}

