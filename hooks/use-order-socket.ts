'use client'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { connectSocket, disconnectSocket, isDuplicate } from '@/lib/socket/socket-client'
import { useCustomerStore } from '@/store/customer.store'
import { useDeliveryStore } from '@/store/delivery.store'
import { useAuthStore } from '@/store/auth.store'
import { ordersApi } from '@/lib/api/orders'
import type {
  OrderNewPayload,
  OrderAcceptedPayload,
  OrderStatusUpdatedPayload,
  OrderCancelledPayload,
} from '@/types'

const EVENTS = {
  ORDER_NEW: 'v1:ORDER:NEW',
  ORDER_ACCEPTED: 'v1:ORDER:ACCEPTED',
  ORDER_STATUS_UPDATED: 'v1:ORDER:STATUS_UPDATED',
  ORDER_CANCELLED: 'v1:ORDER:CANCELLED',
  ORDER_LOCATION_UPDATED: 'v1:ORDER:LOCATION_UPDATED',
}

export function useOrderSocket() {
  const user = useAuthStore((s) => s.user)
  const { updateOrderStatus, setActiveOrder } = useCustomerStore()
  const { addAvailableOrder, removeAvailableOrder, setActiveOrder: setDeliveryActive, updateActiveOrderStatus } = useDeliveryStore()
  const reconnectRef = useRef(false)

  useEffect(() => {
    if (!user) return

    const socket = connectSocket('/order')

    // Remove any stale listeners from a previous mount before re-registering
    socket.off(EVENTS.ORDER_NEW)
    socket.off(EVENTS.ORDER_ACCEPTED)
    socket.off(EVENTS.ORDER_STATUS_UPDATED)
    socket.off(EVENTS.ORDER_CANCELLED)
    socket.off(EVENTS.ORDER_LOCATION_UPDATED)
    socket.off('connect')
    socket.off('disconnect')
    socket.off('reconnect')

    const refetchAvailable = async () => {
      if (user.role !== 'delivery') return
      try {
        const res = await ordersApi.listAvailable()
        useDeliveryStore.getState().setAvailableOrders(res.data.data)
      } catch { /* ignore */ }
    }

    const refetchActiveOrder = async () => {
      if (user.role !== 'delivery') return
      try {
        const res = await ordersApi.getMyActive()
        const order = res.data.data ?? null
        useDeliveryStore.getState().setActiveOrder(order)
        // Re-join the order room if there's an active order
        if (order) {
          socket.emit('join:order', { orderId: order._id })
        }
      } catch { /* ignore */ }
    }

    socket.on('connect', () => {
      if (reconnectRef.current) {
        // Rejoin rooms and refetch on reconnect
        refetchAvailable()
        refetchActiveOrder()
      }
      reconnectRef.current = true
    })

    socket.on('disconnect', () => {
      toast.error('Connection lost — reconnecting…', { id: 'socket-disconnect' })
    })

    socket.on('reconnect', () => {
      toast.success('Reconnected', { id: 'socket-disconnect' })
      refetchAvailable()
      refetchActiveOrder()
    })

    // ── ORDER_NEW (delivery) ──────────────────────────────────────────────
    socket.on(EVENTS.ORDER_NEW, (payload: OrderNewPayload) => {
      if (isDuplicate(payload.eventId)) return
      if (user.role === 'delivery') {
        addAvailableOrder({
          _id: payload.orderId,
          customerId: payload.customerId,
          items: payload.items,
          totalAmount: payload.totalAmount,
          deliveryAddress: payload.address,
          status: 'PENDING',
          statusHistory: [],
          createdAt: payload.timestamp,
          updatedAt: payload.timestamp,
        })
        toast('New order available', { description: `₹${payload.totalAmount}` })
      }
    })

    // ── ORDER_ACCEPTED (customer) ─────────────────────────────────────────
    socket.on(EVENTS.ORDER_ACCEPTED, (payload: OrderAcceptedPayload) => {
      if (isDuplicate(payload.eventId)) return
      if (user.role === 'customer') {
        updateOrderStatus(payload.orderId, 'ACCEPTED')
        toast.success('Your order was accepted by a delivery partner')
      }
      if (user.role === 'delivery') {
        removeAvailableOrder(payload.orderId)
      }
    })

    // ── ORDER_STATUS_UPDATED ──────────────────────────────────────────────
    socket.on(EVENTS.ORDER_STATUS_UPDATED, (payload: OrderStatusUpdatedPayload) => {
      if (isDuplicate(payload.eventId)) return
      if (user.role === 'customer') {
        updateOrderStatus(payload.orderId, payload.status)
        const labels: Record<string, string> = {
          PICKED_UP: 'Order picked up',
          ON_THE_WAY: 'Order on the way',
          DELIVERED: 'Order delivered!',
        }
        if (labels[payload.status]) toast.success(labels[payload.status])
        if (payload.status === 'DELIVERED') {
          useCustomerStore.getState().setShowDeliveredPopup(true)
          useCustomerStore.getState().setPartnerCoords(null)
        }
      }
      if (user.role === 'delivery') {
        updateActiveOrderStatus(payload.status)
        const deliveryLabels: Record<string, string> = {
          PICKED_UP: 'Marked as picked up',
          ON_THE_WAY: 'Delivery started',
          DELIVERED: 'Order delivered — commission credited!',
        }
        if (deliveryLabels[payload.status]) toast.success(deliveryLabels[payload.status])
        if (payload.status === 'DELIVERED') {
          useDeliveryStore.getState().setShowDeliveredPopup(true)
          useDeliveryStore.getState().setPartnerCoords(null)
          // Clear active order so partner can accept new orders immediately
          setTimeout(() => {
            useDeliveryStore.getState().setActiveOrder(null)
          }, 6500)
          // Refetch available orders so the list is fresh
          refetchAvailable()
        }
      }
    })

    // ── ORDER_CANCELLED ───────────────────────────────────────────────────
    socket.on(EVENTS.ORDER_CANCELLED, (payload: OrderCancelledPayload) => {
      if (isDuplicate(payload.eventId)) return
      if (user.role === 'customer') {
        updateOrderStatus(payload.orderId, 'CANCELLED')
        useCustomerStore.getState().setPartnerCoords(null)
        toast.error('Order cancelled', { description: payload.reason ?? undefined })
      }
      if (user.role === 'delivery') {
        removeAvailableOrder(payload.orderId)
        const currentActive = useDeliveryStore.getState().activeOrder
        if (currentActive && currentActive._id === payload.orderId) {
          setDeliveryActive(null)
          useDeliveryStore.getState().setPartnerCoords(null)
          toast.error('Order cancelled by customer', {
            description: payload.reason ?? undefined,
          })
        }
      }
    })

    // ── ORDER_LOCATION_UPDATED (customer) ─────────────────────────────────
    socket.on(EVENTS.ORDER_LOCATION_UPDATED, (payload: { orderId: string; lat: number; lng: number }) => {
      if (user.role === 'customer') {
        // Store in Zustand so coords survive navigation
        useCustomerStore.getState().setPartnerCoords({ lat: payload.lat, lng: payload.lng })
        // Also dispatch DOM event for the order detail page live update
        window.dispatchEvent(new CustomEvent('partner-location', { detail: payload }))
      }
    })

    return () => {
      socket.off(EVENTS.ORDER_NEW)
      socket.off(EVENTS.ORDER_ACCEPTED)
      socket.off(EVENTS.ORDER_STATUS_UPDATED)
      socket.off(EVENTS.ORDER_CANCELLED)
      socket.off(EVENTS.ORDER_LOCATION_UPDATED)
      socket.off('connect')
      socket.off('disconnect')
      socket.off('reconnect')
    }
  }, [user])
}
