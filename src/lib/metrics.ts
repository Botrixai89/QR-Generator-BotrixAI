/**
 * Metrics Collection System
 * Collects and aggregates application metrics (request rate, error rate, latency, payment conversion, churn, LTV)
 */

import { supabaseAdmin } from '@/lib/supabase'

export interface MetricValue {
  name: string
  value: number
  labels?: Record<string, string | number>
  timestamp?: Date
}

export interface RequestMetric {
  correlationId: string
  endpoint: string
  method: string
  statusCode: number
  responseTime: number // milliseconds
  requestSize?: number // bytes
  responseSize?: number // bytes
  userId?: string
  organizationId?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Record a metric
 */
export async function recordMetric(
  name: string,
  value: number,
  labels?: Record<string, string | number>
): Promise<void> {
  try {
    await supabaseAdmin!.from('Metric').insert({
      name,
      value,
      labels: labels || {},
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    // Don't fail the request if metric recording fails
    console.error('Failed to record metric:', error)
  }
}

/**
 * Record a request metric
 */
export async function recordRequestMetric(metric: RequestMetric): Promise<void> {
  try {
    await supabaseAdmin!.from('RequestMetric').insert({
      correlationId: metric.correlationId,
      endpoint: metric.endpoint,
      method: metric.method,
      statusCode: metric.statusCode,
      responseTime: metric.responseTime,
      requestSize: metric.requestSize || 0,
      responseSize: metric.responseSize || 0,
      userId: metric.userId || null,
      organizationId: metric.organizationId || null,
      ipAddress: metric.ipAddress || null,
      userAgent: metric.userAgent || null,
      createdAt: new Date().toISOString(),
    })
    
    // Also record aggregate metrics
    await recordMetric('request_count', 1, {
      endpoint: metric.endpoint,
      method: metric.method,
      status: metric.statusCode >= 500 ? 'error' : metric.statusCode >= 400 ? 'warning' : 'success',
    })
    
    if (metric.statusCode >= 500) {
      await recordMetric('error_count', 1, {
        endpoint: metric.endpoint,
        method: metric.method,
      })
    }
    
    await recordMetric('response_time', metric.responseTime, {
      endpoint: metric.endpoint,
      method: metric.method,
    })
  } catch (error) {
    // Don't fail the request if metric recording fails
    console.error('Failed to record request metric:', error)
  }
}

/**
 * Get metrics for a time period
 */
export async function getMetrics(
  name: string,
  startDate: Date,
  endDate: Date,
  labels?: Record<string, string | number>
): Promise<{
  count: number
  sum: number
  avg: number
  min: number
  max: number
  values: Array<{ timestamp: string; value: number }>
}> {
  try {
    let query = supabaseAdmin!
      .from('Metric')
      .select('*')
      .eq('name', name)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true })
    
    // Apply label filters if provided
    if (labels && Object.keys(labels).length > 0) {
      // Note: Supabase JSONB filtering may need adjustment based on your setup
      for (const [key, value] of Object.entries(labels)) {
        query = query.contains('labels', { [key]: value }) as any
      }
    }
    
    const { data, error } = await query
    
    if (error || !data || data.length === 0) {
      return {
        count: 0,
        sum: 0,
        avg: 0,
        min: 0,
        max: 0,
        values: [],
      }
    }
    
    const values = data.map((m: any) => ({
      timestamp: m.timestamp,
      value: parseFloat(m.value),
    }))
    
    const numericValues = values.map(v => v.value)
    
    return {
      count: values.length,
      sum: numericValues.reduce((a, b) => a + b, 0),
      avg: numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : 0,
      min: numericValues.length > 0 ? Math.min(...numericValues) : 0,
      max: numericValues.length > 0 ? Math.max(...numericValues) : 0,
      values,
    }
  } catch (error) {
    console.error('Failed to get metrics:', error)
    return {
      count: 0,
      sum: 0,
      avg: 0,
      min: 0,
      max: 0,
      values: [],
    }
  }
}

/**
 * Get request rate (requests per second)
 */
export async function getRequestRate(
  startDate: Date,
  endDate: Date,
  endpoint?: string
): Promise<number> {
  try {
    let query = supabaseAdmin!
      .from('RequestMetric')
      .select('id', { count: 'exact', head: true })
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
    
    if (endpoint) {
      query = query.eq('endpoint', endpoint)
    }
    
    const { count, error } = await query
    
    if (error || count === null) {
      return 0
    }
    
    const timeDiffSeconds = (endDate.getTime() - startDate.getTime()) / 1000
    return timeDiffSeconds > 0 ? count / timeDiffSeconds : 0
  } catch (error) {
    console.error('Failed to get request rate:', error)
    return 0
  }
}

/**
 * Get error rate (errors per total requests)
 */
export async function getErrorRate(
  startDate: Date,
  endDate: Date,
  endpoint?: string
): Promise<number> {
  try {
    let baseQuery = supabaseAdmin!
      .from('RequestMetric')
      .select('id', { count: 'exact', head: true })
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
    
    if (endpoint) {
      baseQuery = baseQuery.eq('endpoint', endpoint)
    }
    
    const { count: totalCount } = await baseQuery
    
    let errorQuery = supabaseAdmin!
      .from('RequestMetric')
      .select('id', { count: 'exact', head: true })
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
      .gte('statusCode', 500)
    
    if (endpoint) {
      errorQuery = errorQuery.eq('endpoint', endpoint)
    }
    
    const { count: errorCount } = await errorQuery
    
    if (totalCount === null || totalCount === 0) {
      return 0
    }
    
    return (errorCount || 0) / totalCount
  } catch (error) {
    console.error('Failed to get error rate:', error)
    return 0
  }
}

/**
 * Get average latency
 */
export async function getAverageLatency(
  startDate: Date,
  endDate: Date,
  endpoint?: string
): Promise<number> {
  try {
    let query = supabaseAdmin!
      .from('RequestMetric')
      .select('responseTime')
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
    
    if (endpoint) {
      query = query.eq('endpoint', endpoint)
    }
    
    const { data, error } = await query
    
    if (error || !data || data.length === 0) {
      return 0
    }
    
    const times = data.map((m: any) => m.responseTime)
    return times.reduce((a, b) => a + b, 0) / times.length
  } catch (error) {
    console.error('Failed to get average latency:', error)
    return 0
  }
}

/**
 * Get payment conversion rate
 */
export async function getPaymentConversionRate(
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    // Get total users who visited pricing page (or initiated payment)
    // This is a simplified example - adjust based on your tracking
    const { count: initiatedCount } = await supabaseAdmin!
      .from('RequestMetric')
      .select('id', { count: 'exact', head: true })
      .eq('endpoint', '/api/billing/subscriptions/create')
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
    
    // Get successful payments
    const { count: paidCount } = await supabaseAdmin!
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'paid')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
    
    if (initiatedCount === null || initiatedCount === 0) {
      return 0
    }
    
    return (paidCount || 0) / initiatedCount
  } catch (error) {
    console.error('Failed to get payment conversion rate:', error)
    return 0
  }
}

/**
 * Get churn rate
 */
export async function getChurnRate(
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    // Get total active users at start of period
    const { count: startActive } = await supabaseAdmin!
      .from('Subscription')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('createdAt', startDate.toISOString())
    
    // Get canceled subscriptions in period
    const { count: canceled } = await supabaseAdmin!
      .from('Subscription')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'canceled')
      .gte('canceledAt', startDate.toISOString())
      .lte('canceledAt', endDate.toISOString())
    
    if (startActive === null || startActive === 0) {
      return 0
    }
    
    return (canceled || 0) / startActive
  } catch (error) {
    console.error('Failed to get churn rate:', error)
    return 0
  }
}

/**
 * Get average LTV (Lifetime Value)
 */
export async function getAverageLTV(
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    // Get all users who made at least one payment
    const { data: users, error } = await supabaseAdmin!
      .from('payments')
      .select('user_id, amount')
      .eq('status', 'paid')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
    
    if (error || !users || users.length === 0) {
      return 0
    }
    
    // Calculate total LTV per user
    const userLTV: Record<string, number> = {}
    for (const payment of users) {
      userLTV[payment.user_id] = (userLTV[payment.user_id] || 0) + (payment.amount || 0)
    }
    
    const ltvValues = Object.values(userLTV)
    return ltvValues.length > 0
      ? ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length
      : 0
  } catch (error) {
    console.error('Failed to get average LTV:', error)
    return 0
  }
}

