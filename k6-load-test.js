/**
 * K6 Load Testing Script
 * Tests QR Generator SaaS under various load scenarios
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const qrCreationDuration = new Trend('qr_creation_duration')
const scanDuration = new Trend('scan_duration')
const failedRequests = new Counter('failed_requests')

// Test configuration
export const options = {
  stages: [
    // Ramp-up
    { duration: '2m', target: 50 },   // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 },  // Spike to 200 users
    { duration: '3m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],      // 95% of requests < 500ms
    http_req_failed: ['rate<0.1'],         // Error rate < 10%
    qr_creation_duration: ['p(95)<1000'],  // 95% QR creations < 1s
    scan_duration: ['p(95)<200'],          // 95% scans < 200ms
    errors: ['rate<0.05'],                 // Overall error rate < 5%
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const API_KEY = __ENV.API_KEY || 'test_api_key'

// Test data
const testURLs = [
  'https://example.com',
  'https://example.com/product/123',
  'https://example.com/promo/summer',
  'https://example.com/event/conference',
  'https://example.com/menu/restaurant',
]

export default function () {
  // Scenario 1: Homepage Load
  let response = http.get(`${BASE_URL}/`)
  check(response, {
    'homepage loads': (r) => r.status === 200,
    'homepage load time < 1s': (r) => r.timings.duration < 1000,
  })
  
  errorRate.add(response.status >= 400)
  sleep(1)

  // Scenario 2: Create QR Code
  const qrData = new FormData()
  qrData.append('url', testURLs[Math.floor(Math.random() * testURLs.length)])
  qrData.append('title', `Load Test QR ${__VU}-${__ITER}`)
  qrData.append('foregroundColor', '#000000')
  qrData.append('backgroundColor', '#FFFFFF')

  response = http.post(`${BASE_URL}/api/v2/qr-codes`, qrData.body(), {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  })

  const qrCreationSuccess = check(response, {
    'QR creation status 201': (r) => r.status === 201,
    'QR creation time < 1s': (r) => r.timings.duration < 1000,
    'QR has ID': (r) => {
      try {
        const json = JSON.parse(r.body)
        return json.id !== undefined
      } catch {
        return false
      }
    },
  })

  if (!qrCreationSuccess) {
    failedRequests.add(1)
  }

  qrCreationDuration.add(response.timings.duration)
  errorRate.add(response.status >= 400)
  
  let qrCodeId = null
  try {
    qrCodeId = JSON.parse(response.body).id
  } catch {
    // Ignore parse errors
  }

  sleep(1)

  // Scenario 3: List QR Codes
  response = http.get(`${BASE_URL}/api/qr-codes`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  })

  check(response, {
    'QR list loads': (r) => r.status === 200,
    'QR list time < 500ms': (r) => r.timings.duration < 500,
  })

  errorRate.add(response.status >= 400)
  sleep(1)

  // Scenario 4: Scan QR Code (if created)
  if (qrCodeId) {
    response = http.get(`${BASE_URL}/api/qr-codes/${qrCodeId}/scan`, {
      headers: {
        'User-Agent': 'k6-load-test',
        'X-Forwarded-For': `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      },
    })

    check(response, {
      'QR scan succeeds': (r) => r.status === 200 || r.status === 302,
      'QR scan time < 200ms': (r) => r.timings.duration < 200,
    })

    scanDuration.add(response.timings.duration)
    errorRate.add(response.status >= 400)
  }

  sleep(1)

  // Scenario 5: Analytics Query
  response = http.get(`${BASE_URL}/api/dashboard/stats`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  })

  check(response, {
    'Analytics loads': (r) => r.status === 200,
    'Analytics time < 500ms': (r) => r.timings.duration < 500,
  })

  errorRate.add(response.status >= 400)
  sleep(2)
}

// Setup and teardown
export function setup() {
  console.log('🚀 Starting load test...')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Target users: 200`)
  console.log(`Duration: ~21 minutes`)
}

export function teardown(data) {
  console.log('✅ Load test completed')
  console.log('Check the summary above for results')
}

