'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  Download,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

interface UsageStats {
  requestCount: number
  errorCount: number
  avgResponseTime: number
  totalRequestSize: number
  totalResponseSize: number
}

export default function ApiUsageStats() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiKeyId, setApiKeyId] = useState<string>('')
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadStats()
  }, [apiKeyId, startDate, endDate])

  const loadStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate + 'T23:59:59').toISOString(),
      })
      if (apiKeyId) {
        params.append('apiKeyId', apiKeyId)
      }

      const res = await fetch(`/api/v1/usage?${params}`, {
        headers: {
          Authorization: `Bearer ${await getApiKey()}`,
        },
      })

      if (!res.ok) {
        throw new Error('Failed to load usage stats')
      }

      const data = await res.json()
      setStats(data.usage)
    } catch (error) {
      console.error('Error loading usage stats:', error)
      toast.error('Failed to load usage statistics')
    } finally {
      setLoading(false)
    }
  }

  // Helper to get API key from session or prompt
  const getApiKey = async (): Promise<string> => {
    // In a real app, you'd get this from storage or prompt user
    // For now, return empty string and let the API handle auth
    return ''
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading && !stats) {
    return <div>Loading usage statistics...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">API Usage & Analytics</h2>
        <p className="text-muted-foreground">
          Monitor your API usage, performance, and errors
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="apiKeyId">API Key (Optional)</Label>
              <Input
                id="apiKeyId"
                value={apiKeyId}
                onChange={(e) => setApiKeyId(e.target.value)}
                placeholder="Filter by API key..."
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadStats} className="w-full">
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.requestCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.errorCount > 0 && (
                  <span className="text-destructive">
                    {stats.errorCount} errors
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.requestCount > 0
                  ? ((stats.errorCount / stats.requestCount) * 100).toFixed(2)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.errorCount} of {stats.requestCount} requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.avgResponseTime)}ms
              </div>
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Transfer</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBytes(stats.totalRequestSize + stats.totalResponseSize)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(stats.totalRequestSize)} sent /{' '}
                {formatBytes(stats.totalResponseSize)} received
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!stats && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No usage data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

