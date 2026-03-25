'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Order } from '@/types'

interface DeliveryState {
  availableOrders: Order[]
  activeOrder: Order | null
  isLoading: boolean
  isOnline: boolean
  // Persisted partner coords so map survives navigation
  partnerCoords: { lat: number; lng: number } | null
  showDeliveredPopup: boolean

  setAvailableOrders: (orders: Order[]) => void
  addAvailableOrder: (order: Order) => void
  removeAvailableOrder: (orderId: string) => void
  setActiveOrder: (order: Order | null) => void
  updateActiveOrderStatus: (status: string) => void
  setLoading: (v: boolean) => void
  setOnline: (v: boolean) => void
  setPartnerCoords: (coords: { lat: number; lng: number } | null) => void
  setShowDeliveredPopup: (v: boolean) => void
}

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set, get) => ({
      availableOrders: [],
      activeOrder: null,
      isLoading: false,
      isOnline: true,
      partnerCoords: null,
      showDeliveredPopup: false,

      setAvailableOrders: (orders) =>
        set({
          availableOrders: [...orders].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        }),

      addAvailableOrder: (order) => {
        const exists = get().availableOrders.some((o) => o._id === order._id)
        if (!exists) {
          const updated = [order, ...get().availableOrders].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          set({ availableOrders: updated })
        }
      },

      removeAvailableOrder: (orderId) =>
        set({ availableOrders: get().availableOrders.filter((o) => o._id !== orderId) }),

      setActiveOrder: (order) => set({ activeOrder: order }),

      updateActiveOrderStatus: (status) => {
        const active = get().activeOrder
        if (active) set({ activeOrder: { ...active, status: status as Order['status'] } })
      },

      setLoading: (v) => set({ isLoading: v }),
      setOnline: (v) => set({ isOnline: v }),
      setPartnerCoords: (coords) => set({ partnerCoords: coords }),
      setShowDeliveredPopup: (v) => set({ showDeliveredPopup: v }),
    }),
    {
      name: 'delivery-store',
      // Only persist activeOrder, isOnline, partnerCoords — availableOrders are always fresh from API
      partialize: (state) => ({
        activeOrder: state.activeOrder,
        isOnline: state.isOnline,
        partnerCoords: state.partnerCoords,
      }),
    },
  ),
)
