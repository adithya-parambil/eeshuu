'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Product, Order, CartItem, ApiMeta } from '@/types'

interface CustomerState {
  // Products
  products: Product[]
  productsMeta: ApiMeta | null
  productsLoading: boolean

  // Cart — persisted to localStorage
  cart: CartItem[]

  // Orders
  orders: Order[]
  ordersMeta: ApiMeta | null
  ordersLoading: boolean
  activeOrder: Order | null
  // Persisted partner coords so map survives navigation
  partnerCoords: { lat: number; lng: number } | null
  showDeliveredPopup: boolean

  // Actions
  setProducts: (products: Product[], meta: ApiMeta) => void
  setProductsLoading: (v: boolean) => void
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateCartQty: (productId: string, quantity: number) => void
  clearCart: () => void
  setOrders: (orders: Order[], meta: ApiMeta) => void
  setOrdersLoading: (v: boolean) => void
  setActiveOrder: (order: Order | null) => void
  updateOrderInList: (orderId: string, patch: Partial<Order>) => void
  prependOrder: (order: Order) => void
  setPartnerCoords: (coords: { lat: number; lng: number } | null) => void
  setShowDeliveredPopup: (v: boolean) => void
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      products: [],
      productsMeta: null,
      productsLoading: false,
      cart: [],
      orders: [],
      ordersMeta: null,
      ordersLoading: false,
      activeOrder: null,
      partnerCoords: null,
      showDeliveredPopup: false,

      setProducts: (products, meta) => set({ products, productsMeta: meta }),
      setProductsLoading: (v) => set({ productsLoading: v }),

      addToCart: (product, quantity = 1) => {
        const cart = get().cart
        const existing = cart.find((i) => i.product._id === product._id)
        if (existing) {
          set({ cart: cart.map((i) => i.product._id === product._id ? { ...i, quantity: i.quantity + quantity } : i) })
        } else {
          set({ cart: [...cart, { product, quantity }] })
        }
        // Broadcast to other devices (will be called in component)
      },

      removeFromCart: (productId) => {
        set({ cart: get().cart.filter((i) => i.product._id !== productId) })
        // Broadcast to other devices (will be called in component)
      },

      updateCartQty: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId)
          return
        }
        set({ cart: get().cart.map((i) => i.product._id === productId ? { ...i, quantity } : i) })
        // Broadcast to other devices (will be called in component)
      },

      clearCart: () => {
        set({ cart: [] })
        // Broadcast to other devices (will be called in component)
      },

      setOrders: (orders, meta) => set({ orders, ordersMeta: meta }),
      setOrdersLoading: (v) => set({ ordersLoading: v }),
      setActiveOrder: (order) => set({ activeOrder: order }),

      updateOrderInList: (orderId, patch) => {
        set({
          orders: get().orders.map((o) => o._id === orderId ? { ...o, ...patch } : o),
          activeOrder: get().activeOrder?._id === orderId
            ? { ...get().activeOrder!, ...patch }
            : get().activeOrder,
        })
      },

      prependOrder: (order) => set({ orders: [order, ...get().orders] }),

      setPartnerCoords: (coords) => set({ partnerCoords: coords }),
      setShowDeliveredPopup: (v) => set({ showDeliveredPopup: v }),
    }),
    {
      name: 'eeshuu-cart',
      storage: createJSONStorage(() => localStorage),
      // Only persist the cart — everything else is fetched fresh on mount
      partialize: (state) => ({ cart: state.cart }),
    },
  ),
)
