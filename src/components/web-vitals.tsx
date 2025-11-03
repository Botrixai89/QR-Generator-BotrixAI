/**
 * Web Vitals Component
 * Initializes Web Vitals tracking on the client
 */

'use client'

import { useEffect } from 'react'
import { initializeWebVitals } from '@/lib/web-vitals'

export function WebVitals() {
  useEffect(() => {
    initializeWebVitals()
  }, [])
  
  return null
}

