/**
 * QR Code Store - Zustand
 * Manages QR codes state and operations
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { toast } from 'sonner'

interface QRCode {
  id: string
  userId: string
  url: string
  title: string
  foregroundColor: string
  backgroundColor: string
  dotType: string
  cornerType: string
  hasWatermark: boolean
  logoUrl?: string
  downloadCount: number
  createdAt: string
  updatedAt: string
  isDynamic?: boolean
  scanCount?: number
}

interface QRCodeState {
  qrCodes: QRCode[]
  isLoading: boolean
  error: string | null
  selectedQRCode: QRCode | null

  // Actions
  setQRCodes: (qrCodes: QRCode[]) => void
  addQRCode: (qrCode: QRCode) => void
  updateQRCode: (id: string, updates: Partial<QRCode>) => void
  deleteQRCode: (id: string) => void
  setSelectedQRCode: (qrCode: QRCode | null) => void
  fetchQRCodes: () => Promise<void>
  createQRCode: (data: FormData) => Promise<QRCode | null>
  removeQRCode: (id: string) => Promise<boolean>
  reset: () => void
}

export const useQRStore = create<QRCodeState>()(
  devtools(
    (set, get) => ({
      qrCodes: [],
      isLoading: false,
      error: null,
      selectedQRCode: null,

      setQRCodes: (qrCodes) => set({ qrCodes }),

      addQRCode: (qrCode) =>
        set((state) => ({
          qrCodes: [qrCode, ...state.qrCodes],
        })),

      updateQRCode: (id, updates) =>
        set((state) => ({
          qrCodes: state.qrCodes.map((qr) =>
            qr.id === id ? { ...qr, ...updates } : qr
          ),
        })),

      deleteQRCode: (id) =>
        set((state) => ({
          qrCodes: state.qrCodes.filter((qr) => qr.id !== id),
        })),

      setSelectedQRCode: (qrCode) => set({ selectedQRCode: qrCode }),

      fetchQRCodes: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/qr-codes')
          if (!response.ok) {
            throw new Error('Failed to fetch QR codes')
          }
          const qrCodes = await response.json()
          set({ qrCodes, isLoading: false })
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          set({ error: errorMessage, isLoading: false })
          toast.error('Failed to load QR codes')
        }
      },

      createQRCode: async (formData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/qr-codes', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || 'Failed to create QR code')
          }

          const qrCode = await response.json()
          
          // Add to store
          get().addQRCode(qrCode)
          
          set({ isLoading: false })
          toast.success('QR code created successfully!')
          
          return qrCode
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to create QR code'
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
          return null
        }
      },

      removeQRCode: async (id) => {
        try {
          const response = await fetch(`/api/qr-codes/${id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('Failed to delete QR code')
          }

          // Remove from store
          get().deleteQRCode(id)
          
          toast.success('QR code deleted successfully')
          return true
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to delete QR code'
          toast.error(errorMessage)
          return false
        }
      },

      reset: () =>
        set({
          qrCodes: [],
          isLoading: false,
          error: null,
          selectedQRCode: null,
        }),
    }),
    { name: 'QRStore' }
  )
)

// Selector hooks for better performance (prevent unnecessary re-renders)
export const useQRCodes = () => useQRStore((state) => state.qrCodes)
export const useQRCodesLoading = () => useQRStore((state) => state.isLoading)
export const useQRCodesError = () => useQRStore((state) => state.error)
export const useSelectedQRCode = () => useQRStore((state) => state.selectedQRCode)
export const useQRCodesCount = () => useQRStore((state) => state.qrCodes.length)

// Computed selectors
export const useDynamicQRCodes = () =>
  useQRStore((state) => state.qrCodes.filter((qr) => qr.isDynamic))

export const useRecentQRCodes = (limit: number = 10) =>
  useQRStore((state) => state.qrCodes.slice(0, limit))

export const useTotalScans = () =>
  useQRStore((state) =>
    state.qrCodes.reduce((total, qr) => total + (qr.scanCount || 0), 0)
  )

