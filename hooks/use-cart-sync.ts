'use client'
import { useEffect, useRef, useCallback } from 'react'
import { connectSocket, isDuplicate, getSocket } from '@/lib/socket/socket-client'
import { useCustomerStore } from '@/store/customer.store'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

const EVENTS = {
  CART_UPDATED: 'v1:CART:UPDATED',
}

export function useCartSync() {
  const user = useAuthStore((s) => s.user)
  const { cart, addToCart, removeFromCart, updateCartQty } = useCustomerStore()
  const lastSyncRef = useRef<number>(0)
  const isLocalUpdateRef = useRef(false)

  useEffect(() => {
    if (!user || user.role !== 'customer') return

    const socket = connectSocket('/order')

    socket.off(EVENTS.CART_UPDATED)

    socket.on(EVENTS.CART_UPDATED, (payload: { 
      userId: string
      action: 'ADD' | 'REMOVE' | 'UPDATE' | 'CLEAR'
      productId?: string
      quantity?: number
      eventId: string 
    }) => {
      if (isDuplicate(payload.eventId)) return
      if (payload.userId !== user.userId) return
      
      // Skip if this is our own action
      if (isLocalUpdateRef.current) {
        isLocalUpdateRef.current = false
        return
      }
      
      // Apply the remote cart change locally
      const now = Date.now()
      if (now - lastSyncRef.current < 500) return // Skip if we just synced within 500ms
      
      try {
        switch (payload.action) {
          case 'ADD':
            if (payload.productId && payload.quantity) {
              // Need to fetch product details or get from payload
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

    return () => {
      socket.off(EVENTS.CART_UPDATED)
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
    
    const socket = getSocket('/order')
    
    socket.emit(EVENTS.CART_UPDATED, {
      userId: user.userId,
      action,
      productId,
      quantity,
      timestamp: Date.now(),
    })
  }, [user])

  return { broadcastCartAction }
}
