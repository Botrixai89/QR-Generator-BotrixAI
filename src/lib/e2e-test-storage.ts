"use client"

export interface E2ETestQrCodeRecord {
  id: string
  title: string
  url: string
  originalUrl?: string
  foregroundColor: string
  backgroundColor: string
  dotType: string
  cornerType: string
  hasWatermark: boolean
  createdAt: string
  updatedAt: string
  downloadCount: number
}

const STORAGE_KEY = "e2e-test-qr-codes"

const safeParse = (value: string | null): E2ETestQrCodeRecord[] => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value) as E2ETestQrCodeRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const readTestQrCodes = (): E2ETestQrCodeRecord[] => {
  if (typeof window === "undefined") return []
  return safeParse(sessionStorage.getItem(STORAGE_KEY))
}

export const writeTestQrCodes = (records: E2ETestQrCodeRecord[]) => {
  if (typeof window === "undefined") return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const appendTestQrCode = (record: E2ETestQrCodeRecord): E2ETestQrCodeRecord[] => {
  const existing = readTestQrCodes()
  const updated = [...existing, record]
  writeTestQrCodes(updated)
  return updated
}

export const clearTestQrCodes = () => {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(STORAGE_KEY)
}

