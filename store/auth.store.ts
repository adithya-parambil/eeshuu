'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { tokenStore } from '@/lib/api/client'
import { authApi } from '@/lib/api/auth'
import type { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean

  login: (email: string, password: string) => Promise<void>
  register: (data: {
    name: string
    email: string
    password: string
    role: 'customer' | 'delivery'
    phone?: string
  }) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: AuthUser) => void
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      hydrate: async () => {
        const token = tokenStore.getAccess()
        if (!token || get().user) return
        try {
          const res = await authApi.getProfile()
          const u = res.data.data
          set({
            user: { userId: u._id, name: u.name, email: u.email, role: u.role },
            isAuthenticated: true,
          })
        } catch {
          tokenStore.clear()
          set({ user: null, isAuthenticated: false })
        }
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await authApi.login({ email, password })
          const { accessToken, refreshToken } = res.data.data
          tokenStore.set(accessToken, refreshToken)
          // Fetch full profile — JWT payload only contains userId/role/jti, not name/email
          const profileRes = await authApi.getProfile()
          const u = profileRes.data.data
          set({
            user: { userId: u._id, name: u.name, email: u.email, role: u.role },
            isAuthenticated: true,
          })
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const res = await authApi.register(data)
          const { accessToken, refreshToken } = res.data.data
          tokenStore.set(accessToken, refreshToken)
          set({
            user: { userId: JSON.parse(atob(accessToken.split('.')[1])).userId, name: data.name, email: data.email, role: data.role },
            isAuthenticated: true,
          })
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        try { await authApi.logout() } catch { /* ignore */ }
        tokenStore.clear()
        // Clear role-specific stores to prevent stale data bleeding between sessions
        const { useDeliveryStore } = await import('@/store/delivery.store')
        useDeliveryStore.getState().setActiveOrder(null)
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-store',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    },
  ),
)
