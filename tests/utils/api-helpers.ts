/**
 * API Helpers for Integration Tests
 * Utilities for making authenticated API requests
 */

const BASE_URL = process.env.E2E_BASE_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

/**
 * Make an authenticated API request
 * Note: In a real test environment, you'd need to set up proper session cookies
 * For now, we'll use a test mode where the API accepts userId in headers
 */
export async function apiRequest(
  endpoint: string,
  options: {
    method?: string
    body?: unknown
    userId?: string
    headers?: Record<string, string>
  } = {}
) {
  const { method = 'GET', body, userId, headers = {} } = options
  
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }
  
  // In test mode, pass userId via header (API would need to support this)
  if (userId) {
    requestHeaders['X-Test-User-Id'] = userId
  }
  
  const url = `${BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })
  
  const data = await response.json().catch(() => ({}))
  
  return {
    ok: response.ok,
    status: response.status,
    data,
    headers: response.headers,
  }
}

/**
 * Make a FormData API request (for file uploads)
 */
export async function apiFormDataRequest(
  endpoint: string,
  formData: FormData,
  options: {
    userId?: string
    headers?: Record<string, string>
  } = {}
) {
  const { userId, headers = {} } = options
  
  const requestHeaders: Record<string, string> = {
    ...headers,
  }
  
  if (userId) {
    requestHeaders['X-Test-User-Id'] = userId
  }
  
  const url = `${BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: requestHeaders,
    body: formData,
  })
  
  const data = await response.json().catch(() => ({}))
  
  return {
    ok: response.ok,
    status: response.status,
    data,
    headers: response.headers,
  }
}

