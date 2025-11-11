/**
 * User Store - Zustand
 * Manages user state across the application
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  credits: number
  plan: string
  emailVerified: string | null
}

interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User | null) => void
  updateCredits: (credits: number) => void
  updatePlan: (plan: string) => void
  fetchUser: (userId: string) => Promise<void>
  reset: () => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: false,
        error: null,

        setUser: (user) => set({ user, error: null }),

        updateCredits: (credits) =>
          set((state) => ({
            user: state.user ? { ...state.user, credits } : null,
          })),

        updatePlan: (plan) =>
          set((state) => ({
            user: state.user ? { ...state.user, plan } : null,
          })),

        fetchUser: async (userId) => {
          set({ isLoading: true, error: null })
          try {
            const response = await fetch(`/api/user/${userId}`)
            if (!response.ok) {
              throw new Error('Failed to fetch user')
            }
            const user = await response.json()
            set({ user, isLoading: false })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Unknown error',
              isLoading: false,
            })
          }
        },

        reset: () => set({ user: null, isLoading: false, error: null }),
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({ user: state.user }), // Only persist user data
      }
    ),
    { name: 'UserStore' }
  )
)

// Selector hooks for better performance
export const useUser = () => useUserStore((state) => state.user)
export const useUserCredits = () => useUserStore((state) => state.user?.credits ?? 0)
export const useUserPlan = () => useUserStore((state) => state.user?.plan ?? 'FREE')
export const useUserLoading = () => useUserStore((state) => state.isLoading)

