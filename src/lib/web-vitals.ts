/**
 * Web Vitals Performance Monitoring
 * Collects Core Web Vitals metrics and sends them to monitoring service
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

export interface WebVitalsMetric {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta?: number
  entries?: any[]
}

/**
 * Send Web Vitals to monitoring service
 */
async function sendToAnalytics(metric: WebVitalsMetric): Promise<void> {
  try {
    // Send to your analytics service
    // For now, we'll store in the database
    const { supabaseAdmin } = await import('@/lib/supabase')
    await supabaseAdmin?.from('Metric').insert({
      name: `web_vitals_${metric.name.toLowerCase()}`,
      value: metric.value,
      labels: {
        rating: metric.rating,
        delta: metric.delta || 0,
      },
      timestamp: new Date().toISOString(),
    }).catch(err => {
      console.error('Failed to record web vitals:', err)
    })
    
    // Also send to external analytics if configured
    if (typeof window !== 'undefined' && (window as any).gtag) {
      // Google Analytics 4
      ;(window as any).gtag('event', metric.name, {
        value: Math.round(metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      })
    }
  } catch (error) {
    console.error('Failed to send web vitals:', error)
  }
}

/**
 * Initialize Web Vitals tracking
 */
export function initializeWebVitals(): void {
  if (typeof window === 'undefined') {
    return
  }
  
  // Core Web Vitals
  onCLS(sendToAnalytics)
  // onFID is deprecated, replaced by onINP (Interaction to Next Paint)
  // onINP is already registered below
  onLCP(sendToAnalytics)
  
  // Additional metrics
  onFCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
  onINP(sendToAnalytics)
}

