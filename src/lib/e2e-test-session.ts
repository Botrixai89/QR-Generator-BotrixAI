"use client"

export type E2ETestSession = {
  id: string
  email: string
  name?: string
  plan?: 'FREE' | 'PRO'
}

const STORAGE_KEY = 'e2e-test-session'
const SESSION_COOKIE = 'e2e-session'
export const E2E_TEST_SESSION_EVENT = 'e2e-test-session-change'

const safeParse = (raw: string | null): E2ETestSession | null => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as E2ETestSession
    if (parsed && typeof parsed.id === 'string' && typeof parsed.email === 'string') {
      return parsed
    }
  } catch {
    // Ignore parse errors and treat as no session
  }
  return null
}

const setSessionCookie = (isActive: boolean) => {
  if (typeof document === 'undefined') return
  if (isActive) {
    const maxAge = 7 * 24 * 60 * 60
    document.cookie = `${SESSION_COOKIE}=true; path=/; max-age=${maxAge}; SameSite=Lax`
  } else {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`
  }
}

export const getE2ETestSession = (): E2ETestSession | null => {
  if (typeof window === 'undefined') return null
  return safeParse(sessionStorage.getItem(STORAGE_KEY))
}

export const saveE2ETestSession = (session: E2ETestSession) => {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  setSessionCookie(true)
  window.dispatchEvent(new Event(E2E_TEST_SESSION_EVENT))
}

export const clearE2ETestSession = () => {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
  setSessionCookie(false)
  window.dispatchEvent(new Event(E2E_TEST_SESSION_EVENT))
}

