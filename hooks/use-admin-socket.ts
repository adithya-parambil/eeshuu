'use client'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { connectSocket, isDuplicate } from '@/lib/socket/socket-client'
import { useAdminStore } from '@/store/admin.store'
import { useAuthStore } from '@/store/auth.store'
import { v4 as uuidv4 } from 'uuid'
import type {
  OrderNewPayload,
  OrderAcceptedPayload,
  OrderStatusUpdatedPayload,
  OrderCancelledPayload,
  PartnerOnlinePayload,
} from '@/types'

const EVENTS = {
  ORDER_NEW: 'v1:ORDER:NEW',
  ORDER_ACCEPTED: 'v1:ORDER:ACCEPTED',
  ORDER_STATUS_UPDATED: 'v1:ORDER:STATUS_UPDATED',
  ORDER_CANCELLED: 'v1:ORDER:CANCELLED',
  PARTNER_ONLINE: 'v1:PARTNER:ONLINE',
  PARTNER_OFFLINE: 'v1:PARTNER:OFFLINE',
}

const STATUS_LABEL: Record<string, string> = {
  PICKED_UP: 'Picked Up',
  ON_THE_WAY: 'On the Way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export function useAdminSocket() {
  const user = useAuthStore((s) => s.user)
  const { pushActivity, updateOrderInList, prependOrder, setPartnerOnline, setPartnerOffline } = useAdminStore()

  useEffect(() => {
    if (!user || user.role !== 'admin') return

    const socket = connectSocket('/admin')

    socket.on('disconnect', () => {
      toast.error('Connection lost — reconnecting…', { id: 'admin-socket-disconnect' })
    })

    socket.on('reconnect', () => {
      toast.success('Reconnected', { id: 'admin-socket-disconnect' })
    })

    socket.on(EVENTS.ORDER_NEW, (p: OrderNewPayload) => {
      if (isDuplicate(p.eventId)) return
      prependOrder({
        _id: p.orderId,
        customerId: p.customerId,
        items: p.items,
        totalAmount: p.totalAmount,
        deliveryAddress: p.address,
        status: 'PENDING',
        statusHistory: [],
        createdAt: p.timestamp,
        updatedAt: p.timestamp,
      })
      pushActivity({ id: uuidv4(), type: 'ORDER_NEW', message: `New order #${p.orderId.slice(-6)}`, timestamp: p.timestamp, orderId: p.orderId })
      toast('New order placed', {
        description: `#${p.orderId.slice(-8).toUpperCase()} — ₹${p.totalAmount}`,
      })
    })

    socket.on(EVENTS.ORDER_ACCEPTED, (p: OrderAcceptedPayload) => {
      if (isDuplicate(p.eventId)) return
      updateOrderInList(p.orderId, { status: 'ACCEPTED', deliveryPartnerId: p.deliveryPartnerId })
      pushActivity({ id: uuidv4(), type: 'ORDER_ACCEPTED', message: `Order #${p.orderId.slice(-6)} accepted`, timestamp: p.timestamp, orderId: p.orderId })
      toast.success('Order accepted', {
        description: `#${p.orderId.slice(-8).toUpperCase()} picked up by a partner`,
      })
    })

    socket.on(EVENTS.ORDER_STATUS_UPDATED, (p: OrderStatusUpdatedPayload) => {
      if (isDuplicate(p.eventId)) return
      updateOrderInList(p.orderId, { status: p.status as any })
      pushActivity({ id: uuidv4(), type: 'ORDER_STATUS_UPDATED', message: `Order #${p.orderId.slice(-6)} → ${p.status}`, timestamp: p.timestamp, orderId: p.orderId })
      const label = STATUS_LABEL[p.status]
      if (label) {
        toast.info(`Order ${label.toLowerCase()}`, {
          description: `#${p.orderId.slice(-8).toUpperCase()}`,
        })
      }
    })

    socket.on(EVENTS.ORDER_CANCELLED, (p: OrderCancelledPayload) => {
      if (isDuplicate(p.eventId)) return
      updateOrderInList(p.orderId, { status: 'CANCELLED' })
      pushActivity({ id: uuidv4(), type: 'ORDER_CANCELLED', message: `Order #${p.orderId.slice(-6)} cancelled`, timestamp: p.timestamp, orderId: p.orderId })
      toast.error('Order cancelled', {
        description: p.reason
          ? `#${p.orderId.slice(-8).toUpperCase()} — ${p.reason}`
          : `#${p.orderId.slice(-8).toUpperCase()}`,
      })
    })

    socket.on(EVENTS.PARTNER_ONLINE, (p: PartnerOnlinePayload) => {
      if (isDuplicate(p.eventId)) return
      setPartnerOnline(p.partnerId)
      pushActivity({ id: uuidv4(), type: 'PARTNER_ONLINE', message: `Partner ${p.partnerId.slice(-6)} online`, timestamp: p.timestamp, partnerId: p.partnerId })
      toast.success('Partner online', {
        description: `Partner …${p.partnerId.slice(-6)} is now available`,
        duration: 3000,
      })
    })

    socket.on(EVENTS.PARTNER_OFFLINE, (p: PartnerOnlinePayload) => {
      if (isDuplicate(p.eventId)) return
      setPartnerOffline(p.partnerId)
      pushActivity({ id: uuidv4(), type: 'PARTNER_OFFLINE', message: `Partner ${p.partnerId.slice(-6)} offline`, timestamp: p.timestamp, partnerId: p.partnerId })
      toast.warning('Partner offline', {
        description: `Partner …${p.partnerId.slice(-6)} disconnected`,
        duration: 3000,
      })
    })

    return () => {
      Object.values(EVENTS).forEach((e) => socket.off(e))
      socket.off('disconnect')
      socket.off('reconnect')
    }
  }, [user])
}
