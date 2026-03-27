'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useCustomerStore } from '@/store/customer.store'
import { useAuthStore } from '@/store/auth.store'
import { cartApi } from '@/lib/api/cart'
import { toast } from 'sonner'

const EVENTS = {
  CART_UPDATED: 'v1:CART:UPDATED',
}

export function useCartSync() {
  const user = useAuthStore((s) => s.user)
  const { cart, addToCart, removeFromCart, updateCartQty, setCart } = useCustomerStore()
  const lastSyncRef = useRef<number>(0)
  const isLocalUpdateRef = useRef(false)

  // Fetch cart from server on mount
  useEffect(() => {
    if (!user || user.role !== 'customer') return
    
    ;(async () => {
      try {
        const res = await cartApi.get()
        if (res.data.success && res.data.data.items) {
          const serverCart = res.data.data.items.map((i: any) => ({
            product: i.productId,
            quantity: i.quantity
          }))
          setCart(serverCart)
        }
      } catch (err) {
        console.error('Failed to fetch cart from server:', err)
      }
    })()
  }, [user, setCart])

  useEffect(() => {
    if (!user || user.role !== 'customer') return

    let socket: any | null = null
    let cancelled = false

    ;(async () => {
      const mod = await import('@/lib/socket/socket-client')
      if (cancelled) return
      socket = mod.connectSocket('/order')

      socket.off(EVENTS.CART_UPDATED)

      socket.on(EVENTS.CART_UPDATED, (payload: { 
        userId: string
        action: 'ADD' | 'REMOVE' | 'UPDATE' | 'CLEAR'
        productId?: string
        quantity?: number
        eventId: string 
      }) => {
        if (mod.isDuplicate(payload.eventId)) return
        if (payload.userId !== user.userId) return
        
        if (isLocalUpdateRef.current) {
          isLocalUpdateRef.current = false
          return
        }
        
        const now = Date.now()
        if (now - lastSyncRef.current < 500) return
        
        try {
          switch (payload.action) {
            case 'ADD':
              if (payload.productId && payload.quantity) {
                toast.info('Item added to cart from another device')
              }
              break
            case 'REMOVE':
              if (payload.productId) {
                removeFromCart(payload.productId)
                toast.info('Item removed from cart from another device')
              }
              break
            case 'UPDATE':
              if (payload.productId && payload.quantity !== undefined) {
                updateCartQty(payload.productId, payload.quantity)
              }
              break
            case 'CLEAR':
              useCustomerStore.getState().clearCart()
              toast.info('Cart cleared from another device')
              break
          }
        } catch (err) {
          console.error('Error syncing cart:', err)
        }
      })
    })()

    return () => {
      cancelled = true
      if (socket) socket.off(EVENTS.CART_UPDATED)
    }
  }, [user])

  // Function to broadcast cart update to other devices
  const broadcastCartAction = useCallback((
    action: 'ADD' | 'REMOVE' | 'UPDATE' | 'CLEAR',
    productId?: string,
    quantity?: number
  ) => {
    if (!user) return
    
    isLocalUpdateRef.current = true
    lastSyncRef.current = Date.now()
    
    ;(async () => {
      try {
        // Update on server
        const currentCart = useCustomerStore.getState().cart
        const items = currentCart.map(i => ({
          productId: i.product._id,
          quantity: i.quantity
        }))
        await cartApi.update(items)

        const mod = await import('@/lib/socket/socket-client')
        const socket = mod.getSocket('/order')
        socket.emit(EVENTS.CART_UPDATED, {
          userId: user.userId,
          action,
          productId,
          quantity,
          timestamp: Date.now(),
        })
      } catch (err) {
        console.error('Failed to sync cart to server:', err)
      }
    })()
  }, [user])

  return { broadcastCartAction }
}
