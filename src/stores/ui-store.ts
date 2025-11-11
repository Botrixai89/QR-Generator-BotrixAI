/**
 * UI Store - Zustand
 * Manages UI state (modals, dialogs, loading states)
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UIState {
  // Modal states
  isDeleteModalOpen: boolean
  isAnalyticsModalOpen: boolean
  isUpgradeModalOpen: boolean
  isBulkActionsModalOpen: boolean

  // Loading states
  isPageLoading: boolean
  isActionLoading: boolean

  // Selected items
  selectedQRCodeId: string | null
  selectedBulkIds: string[]

  // Actions
  openDeleteModal: (qrCodeId: string) => void
  closeDeleteModal: () => void
  openAnalyticsModal: (qrCodeId: string) => void
  closeAnalyticsModal: () => void
  openUpgradeModal: () => void
  closeUpgradeModal: () => void
  openBulkActionsModal: () => void
  closeBulkActionsModal: () => void
  
  setPageLoading: (loading: boolean) => void
  setActionLoading: (loading: boolean) => void
  
  selectQRCode: (id: string | null) => void
  toggleBulkSelection: (id: string) => void
  selectAllBulk: (ids: string[]) => void
  clearBulkSelection: () => void
  
  reset: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      isDeleteModalOpen: false,
      isAnalyticsModalOpen: false,
      isUpgradeModalOpen: false,
      isBulkActionsModalOpen: false,
      isPageLoading: false,
      isActionLoading: false,
      selectedQRCodeId: null,
      selectedBulkIds: [],

      // Modal actions
      openDeleteModal: (qrCodeId) =>
        set({ isDeleteModalOpen: true, selectedQRCodeId: qrCodeId }),
      
      closeDeleteModal: () =>
        set({ isDeleteModalOpen: false, selectedQRCodeId: null }),
      
      openAnalyticsModal: (qrCodeId) =>
        set({ isAnalyticsModalOpen: true, selectedQRCodeId: qrCodeId }),
      
      closeAnalyticsModal: () =>
        set({ isAnalyticsModalOpen: false, selectedQRCodeId: null }),
      
      openUpgradeModal: () => set({ isUpgradeModalOpen: true }),
      
      closeUpgradeModal: () => set({ isUpgradeModalOpen: false }),
      
      openBulkActionsModal: () => set({ isBulkActionsModalOpen: true }),
      
      closeBulkActionsModal: () => set({ isBulkActionsModalOpen: false }),

      // Loading actions
      setPageLoading: (loading) => set({ isPageLoading: loading }),
      
      setActionLoading: (loading) => set({ isActionLoading: loading }),

      // Selection actions
      selectQRCode: (id) => set({ selectedQRCodeId: id }),
      
      toggleBulkSelection: (id) =>
        set((state) => ({
          selectedBulkIds: state.selectedBulkIds.includes(id)
            ? state.selectedBulkIds.filter((selectedId) => selectedId !== id)
            : [...state.selectedBulkIds, id],
        })),
      
      selectAllBulk: (ids) => set({ selectedBulkIds: ids }),
      
      clearBulkSelection: () => set({ selectedBulkIds: [] }),

      // Reset
      reset: () =>
        set({
          isDeleteModalOpen: false,
          isAnalyticsModalOpen: false,
          isUpgradeModalOpen: false,
          isBulkActionsModalOpen: false,
          isPageLoading: false,
          isActionLoading: false,
          selectedQRCodeId: null,
          selectedBulkIds: [],
        }),
    }),
    { name: 'UIStore' }
  )
)

// Selector hooks
export const useDeleteModal = () =>
  useUIStore((state) => ({
    isOpen: state.isDeleteModalOpen,
    selectedId: state.selectedQRCodeId,
    open: state.openDeleteModal,
    close: state.closeDeleteModal,
  }))

export const useAnalyticsModal = () =>
  useUIStore((state) => ({
    isOpen: state.isAnalyticsModalOpen,
    selectedId: state.selectedQRCodeId,
    open: state.openAnalyticsModal,
    close: state.closeAnalyticsModal,
  }))

export const useBulkSelection = () =>
  useUIStore((state) => ({
    selectedIds: state.selectedBulkIds,
    count: state.selectedBulkIds.length,
    toggle: state.toggleBulkSelection,
    selectAll: state.selectAllBulk,
    clear: state.clearBulkSelection,
  }))

export const usePageLoading = () => useUIStore((state) => state.isPageLoading)
export const useActionLoading = () => useUIStore((state) => state.isActionLoading)

