'use client'
import { create } from 'zustand'
import type { Order, SystemStats, ApiMeta } from '@/types'

export interface ActivityEvent {
  id: string
  type: 'ORDER_NEW' | 'ORDER_ACCEPTED' | 'ORDER_STATUS_UPDATED' | 'ORDER_CANCELLED' | 'PARTNER_ONLINE' | 'PARTNER_OFFLINE'
  message: string
  timestamp: string
  orderId?: string
  partnerId?: string
}

interface AdminState {
  stats: SystemStats | null
  orders: Order[]
  ordersMeta: ApiMeta | null
  ordersLoading: boolean
  activityFeed: ActivityEvent[]
  onlinePartners: Set<string>

  setStats: (stats: SystemStats) => void
  setOrders: (orders: Order[], meta: ApiMeta) => void
  setOrdersLoading: (v: boolean) => void
  pushActivity: (event: ActivityEvent) => void
  updateOrderInList: (orderId: string, patch: Partial<Order>) => void
  prependOrder: (order: Order) => void
  setPartnerOnline: (partnerId: string) => void
  setPartnerOffline: (partnerId: string) => void
}

export const useAdminStore = create<AdminState>((set, get) => ({
  stats: null,
  orders: [],
  ordersMeta: null,
  ordersLoading: false,
  activityFeed: [],
  onlinePartners: new Set(),

  setStats: (stats) => set({ stats }),
  setOrders: (orders, meta) => set({ orders, ordersMeta: meta }),
  setOrdersLoading: (v) => set({ ordersLoading: v }),

  pushActivity: (event) =>
    set({ activityFeed: [event, ...get().activityFeed].slice(0, 50) }),

  updateOrderInList: (orderId, patch) =>
    set({ orders: get().orders.map((o) => o._id === orderId ? { ...o, ...patch } : o) }),

  prependOrder: (order) => set({ orders: [order, ...get().orders] }),

  setPartnerOnline: (partnerId) => {
    const s = new Set(get().onlinePartners)
    s.add(partnerId)
    set({ onlinePartners: s })
  },

  setPartnerOffline: (partnerId) => {
    const s = new Set(get().onlinePartners)
    s.delete(partnerId)
    set({ onlinePartners: s })
  },
}))
