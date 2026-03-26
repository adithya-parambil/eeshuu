import { Server as SocketIOServer } from 'socket.io'
import { log } from '../../utils/logger'
import { metrics } from '../../utils/metrics'
import { acceptOrderUseCase } from '../../use-cases/order/accept-order.use-case'
import { updateOrderStatusUseCase } from '../../use-cases/order/update-order-status.use-case'
import { orderEventEmitter } from '../../utils/order-event-emitter'
import {
  EVENTS,
  RoomPatterns,
  buildEvent,
  type OrderAcceptedPayload,
  type OrderStatusUpdatedPayload,
  type OrderCancelledPayload,
  type OrderNewPayload,
  type PartnerLocationPayload,
  type BaseEventPayload,
} from '../events/event-catalog'
import { joinRoom, leaveRoom, broadcastToRoom } from '../rooms/room-manager'
import { setOrderLocation, deleteOrderLocation } from '../../utils/location-cache'
import type { OrderItem, DeliveryAddress } from '../../types/global.types'
import { sendNewOrderAlertToPartners } from '../../services/push-notification.service'
import { getAllDeliveryPartnerTokens } from '../../repositories/device-token.repository'

type AckFn = (res: { ok: boolean; error?: string }) => void

// ─── Per-socket idempotency dedup (bounded LRU, 200 entries) ─────────────────
function createEventDedup(maxSize = 200): {
  has: (id: string) => boolean
  add: (id: string) => void
} {
  const seen = new Map<string, true>()
  return {
    has: (id) => seen.has(id),
    add: (id) => {
      if (seen.size >= maxSize) {
        const oldest = seen.keys().next().value
        if (oldest !== undefined) seen.delete(oldest)
      }
      seen.set(id, true)
    },
  }
}

/**
 * setupOrderNamespace — wires the /order Socket.io namespace.
 *
 * Room conventions:
 *   delivery:pool       — all online delivery partners
 *   user:{userId}       — customer's personal room
 *   order:{orderId}     — all parties tracking a specific order
 *   admin:dashboard     — all admin sockets (mirrored events)
 *
 * Every handler: try/catch + always calls ack() — no hanging clients.
 * DB write always completes before any socket emit.
 */
export function setupOrderNamespace(io: SocketIOServer): void {
  const nsp = io.of('/order')
  const adminNsp = io.of('/admin')

  // ── Fix 2: Listen for order.placed → emit v1:ORDER:NEW ──────────────────
  // Listener registered once when namespace is set up, before any connections.
  orderEventEmitter.on('order.placed', (payload: {
    orderId: string
    customerId: string
    items: OrderItem[]
    totalAmount: number
    address: DeliveryAddress
  }) => {
    try {
      const event = buildEvent<Omit<OrderNewPayload, keyof BaseEventPayload>>({
        orderId: payload.orderId,
        customerId: payload.customerId,
        items: payload.items,
        totalAmount: payload.totalAmount,
        address: payload.address,
      })
      // Notify delivery pool of new available order
      const deliveryRoom = RoomPatterns.DELIVERY()
      console.log('[ORDER.PLACED] Broadcasting ORDER_NEW to room:', deliveryRoom)
      console.log('[ORDER.PLACED] Event payload:', event)
      broadcastToRoom(nsp, deliveryRoom, EVENTS.ORDER_NEW, event)
      // Mirror to admin dashboard
      broadcastToRoom(adminNsp, RoomPatterns.ADMIN(), EVENTS.ORDER_NEW, event)
      
      console.log('[ORDER.PLACED] Broadcast complete')
      
      // Send push notifications to all delivery partners (non-blocking)
      setImmediate(async () => {
        try {
          const partnerTokens = await getAllDeliveryPartnerTokens()
          if (partnerTokens.length > 0) {
            await sendNewOrderAlertToPartners(
              partnerTokens,
              payload.orderId,
              payload.totalAmount,
            )
            log.info({ orderId: payload.orderId, count: partnerTokens.length }, 'Push notifications sent to delivery partners')
          }
        } catch (err: any) {
          console.error('[PUSH NOTIFICATION ERROR]', err?.message || err)
          log.error({ err, orderId: payload.orderId }, 'Failed to send push notifications')
        }
      })
      
      metrics.increment('socket_events_total', { event: 'ORDER_NEW', result: 'success' })
      log.info({ orderId: payload.orderId }, 'v1:ORDER:NEW emitted to delivery:pool and admin:dashboard')
    } catch (err: any) {
      console.error('[ORDER.PLACED HANDLER ERROR]', err?.message || err)
      console.error('[ORDER.PLACED HANDLER STACK]', err?.stack)
      log.error({ err, payload }, 'Error in order.placed event handler')
      metrics.increment('socket_events_total', { event: 'ORDER_NEW', result: 'error' })
    }
  })

  // ── Fix 3a: Listen for order.cancelled → emit v1:ORDER:CANCELLED ─────────
  orderEventEmitter.on('order.cancelled', (payload: {
    orderId: string
    customerId: string
    actorId: string
    reason?: string
    deliveryPartnerId?: string
  }) => {
    const event = buildEvent<Omit<OrderCancelledPayload, keyof BaseEventPayload>>({
      orderId: payload.orderId,
      actorId: payload.actorId,
      ...(payload.reason ? { reason: payload.reason } : {}),
      ...(payload.deliveryPartnerId ? { deliveryPartnerId: payload.deliveryPartnerId } : {}),
    })
    broadcastToRoom(nsp, RoomPatterns.ORDER(payload.orderId), EVENTS.ORDER_CANCELLED, event)
    broadcastToRoom(nsp, RoomPatterns.USER(payload.customerId), EVENTS.ORDER_CANCELLED, event)
    // Notify the delivery partner directly in their personal room (if assigned)
    if (payload.deliveryPartnerId) {
      broadcastToRoom(nsp, RoomPatterns.USER(payload.deliveryPartnerId), EVENTS.ORDER_CANCELLED, event)
    }
    broadcastToRoom(adminNsp, RoomPatterns.ADMIN(), EVENTS.ORDER_CANCELLED, event)
    // Clean up cached location — order is cancelled
    deleteOrderLocation(payload.orderId).catch(() => {})
    metrics.increment('socket_events_total', { event: 'ORDER_CANCELLED', result: 'success' })
    log.info({ orderId: payload.orderId }, 'v1:ORDER:CANCELLED emitted')
  })

  // ── Fix: Listen for order.accepted → emit v1:ORDER:ACCEPTED ─────────────
  // Covers the REST path: delivery partner accepts via HTTP, not via socket.
  orderEventEmitter.on('order.accepted', (payload: {
    orderId: string
    deliveryPartnerId: string
    customerId: string
    partnerName: string
  }) => {
    const event = buildEvent<Omit<OrderAcceptedPayload, keyof BaseEventPayload>>({
      orderId: payload.orderId,
      deliveryPartnerId: payload.deliveryPartnerId,
      partnerName: payload.partnerName ?? payload.deliveryPartnerId,
    })
    // Notify the customer in their personal room
    broadcastToRoom(nsp, RoomPatterns.USER(payload.customerId), EVENTS.ORDER_ACCEPTED, event)
    // Notify all parties tracking this specific order
    broadcastToRoom(nsp, RoomPatterns.ORDER(payload.orderId), EVENTS.ORDER_ACCEPTED, event)
    // Remove the order from the delivery pool
    broadcastToRoom(nsp, RoomPatterns.DELIVERY(), EVENTS.ORDER_ACCEPTED, event)
    // Mirror to admin dashboard
    broadcastToRoom(adminNsp, RoomPatterns.ADMIN(), EVENTS.ORDER_ACCEPTED, event)
    metrics.increment('socket_events_total', { event: 'ORDER_ACCEPTED', result: 'success' })
    log.info({ orderId: payload.orderId }, 'v1:ORDER:ACCEPTED emitted via REST path')
  })

  // ── Fix: Listen for order.status_updated → emit v1:ORDER:STATUS_UPDATED ──
  // Covers the REST path: delivery partner updates status via HTTP, not via socket.
  orderEventEmitter.on('order.status_updated', (payload: {
    orderId: string
    status: string
    actorId: string
    updatedAt: Date | string
    customerId: string
  }) => {
    const event = buildEvent<Omit<OrderStatusUpdatedPayload, keyof BaseEventPayload>>({
      orderId: payload.orderId,
      status: payload.status,
      actorId: payload.actorId,
      updatedAt: payload.updatedAt instanceof Date
        ? payload.updatedAt.toISOString()
        : String(payload.updatedAt),
    })
    broadcastToRoom(nsp, RoomPatterns.ORDER(payload.orderId), EVENTS.ORDER_STATUS_UPDATED, event)
    if (payload.customerId) {
      broadcastToRoom(nsp, RoomPatterns.USER(payload.customerId), EVENTS.ORDER_STATUS_UPDATED, event)
    }
    broadcastToRoom(adminNsp, RoomPatterns.ADMIN(), EVENTS.ORDER_STATUS_UPDATED, event)
    if (payload.status === 'DELIVERED') {
      deleteOrderLocation(payload.orderId).catch(() => {})
    }
    metrics.increment('socket_events_total', { event: 'ORDER_STATUS_UPDATED_REST', result: 'success' })
    log.info({ orderId: payload.orderId, status: payload.status }, 'v1:ORDER:STATUS_UPDATED emitted via REST path')
  })

  nsp.on('connection', (socket) => {
    const userId = socket.data.userId as string
    const role = socket.data.role as string
    const dedup = createEventDedup()

    log.info({ socketId: socket.id, userId, role }, 'Order namespace: socket connected')

    // ── Room setup on connect ──────────────────────────────────────────────
    if (role === 'delivery') {
      joinRoom(socket, RoomPatterns.DELIVERY())
      // Fix 3b: PARTNER:ONLINE goes to admin:dashboard, not delivery:pool
      broadcastToRoom(
        adminNsp,
        RoomPatterns.ADMIN(),
        EVENTS.PARTNER_ONLINE,
        buildEvent({ partnerId: userId }),
      )
    } else if (role === 'customer') {
      joinRoom(socket, RoomPatterns.USER(userId))
      // Join customers room to receive product updates
      joinRoom(socket, 'customers')
    }

    // ── join:order / leave:order — customers join to receive location updates ──
    socket.on('join:order', (data: { orderId: string }) => {
      if (data?.orderId) joinRoom(socket, RoomPatterns.ORDER(data.orderId))
    })

    socket.on('leave:order', (data: { orderId: string }) => {
      if (data?.orderId) leaveRoom(socket, RoomPatterns.ORDER(data.orderId))
    })

    // ── v1:ORDER:ACCEPT ────────────────────────────────────────────────────
    socket.on(EVENTS.ORDER_ACCEPT, async (
      data: { eventId?: string; orderId: string },
      ack: AckFn,
    ) => {
      if (role !== 'delivery') {
        ack({ ok: false, error: 'FORBIDDEN' })
        return
      }

      if (data.eventId && dedup.has(data.eventId)) {
        ack({ ok: true })
        return
      }
      if (data.eventId) dedup.add(data.eventId)

      try {
        const order = await acceptOrderUseCase.execute(
          { orderId: data.orderId, deliveryPartnerId: userId },
          { requestId: socket.id },
        )

        if (!order) {
          ack({ ok: false, error: 'ORDER_ALREADY_TAKEN' })
          return
        }

        const payload = buildEvent<Omit<OrderAcceptedPayload, keyof BaseEventPayload>>({
          orderId: data.orderId,
          deliveryPartnerId: userId,
          partnerName: userId,
        })

        // Notify customer in their personal room
        broadcastToRoom(nsp, RoomPatterns.USER(String(order.customerId)), EVENTS.ORDER_ACCEPTED, payload)
        // Notify all parties tracking this order
        broadcastToRoom(nsp, RoomPatterns.ORDER(data.orderId), EVENTS.ORDER_ACCEPTED, payload)
        // Fix 3b: Mirror to admin:dashboard
        broadcastToRoom(adminNsp, RoomPatterns.ADMIN(), EVENTS.ORDER_ACCEPTED, payload)

        joinRoom(socket, RoomPatterns.ORDER(data.orderId))
        leaveRoom(socket, RoomPatterns.DELIVERY())
        // Track active order room so disconnect handler can notify customers
        socket.data.activeOrderRoom = RoomPatterns.ORDER(data.orderId)
        // Fix 4: metrics on success
        metrics.increment('socket_events_total', { event: 'ORDER_ACCEPT', result: 'success' })
        ack({ ok: true })
      } catch (err) {
        log.error({ err, orderId: data.orderId, userId }, 'ORDER_ACCEPT handler error')
        // Fix 4: metrics on error
        metrics.increment('socket_events_total', { event: 'ORDER_ACCEPT', result: 'error' })
        ack({ ok: false, error: 'INTERNAL_ERROR' })
      }
    })

    // ── v1:ORDER:UPDATE_STATUS ─────────────────────────────────────────────
    socket.on(EVENTS.ORDER_UPDATE_STATUS, async (
      data: { eventId?: string; orderId: string; status: string; note?: string },
      ack: AckFn,
    ) => {
      if (role !== 'delivery') {
        ack({ ok: false, error: 'FORBIDDEN' })
        return
      }

      if (data.eventId && dedup.has(data.eventId)) {
        ack({ ok: true })
        return
      }
      if (data.eventId) dedup.add(data.eventId)

      try {
        const updated = await updateOrderStatusUseCase.execute(
          {
            orderId: data.orderId,
            status: data.status as 'ACCEPTED' | 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED',
            note: data.note,
          },
          { requestId: socket.id, actorId: userId, actorRole: role },
        )

        const payload = buildEvent<Omit<OrderStatusUpdatedPayload, keyof BaseEventPayload>>({
          orderId: data.orderId,
          status: data.status,
          actorId: userId,
          updatedAt: updated.updatedAt instanceof Date
            ? updated.updatedAt.toISOString()
            : String(updated.updatedAt),
        })

        broadcastToRoom(nsp, RoomPatterns.ORDER(data.orderId), EVENTS.ORDER_STATUS_UPDATED, payload)
        broadcastToRoom(nsp, RoomPatterns.USER(String(updated.customerId)), EVENTS.ORDER_STATUS_UPDATED, payload)
        // Fix 3b: Mirror to admin:dashboard
        broadcastToRoom(adminNsp, RoomPatterns.ADMIN(), EVENTS.ORDER_STATUS_UPDATED, payload)

        if (data.status === 'DELIVERED') {
          leaveRoom(socket, RoomPatterns.ORDER(data.orderId))
          joinRoom(socket, RoomPatterns.DELIVERY())
          socket.data.activeOrderRoom = null
          // Clean up cached location — order is done
          deleteOrderLocation(data.orderId).catch(() => {})
        }

        // Fix 4: metrics on success
        metrics.increment('socket_events_total', { event: 'ORDER_UPDATE_STATUS', result: 'success' })
        ack({ ok: true })
      } catch (err) {
        log.error({ err, orderId: data.orderId, userId }, 'ORDER_UPDATE_STATUS handler error')
        // Fix 4: metrics on error
        metrics.increment('socket_events_total', { event: 'ORDER_UPDATE_STATUS', result: 'error' })
        const message = err instanceof Error ? err.message : 'INTERNAL_ERROR'
        ack({ ok: false, error: message })
      }
    })

    // ── Fix 3c: v1:PARTNER:STATUS ──────────────────────────────────────────
    socket.on(EVENTS.PARTNER_STATUS, async (
      data: { status: 'online' | 'offline'; eventId?: string },
      ack: AckFn,
    ) => {
      if (role !== 'delivery') {
        ack({ ok: false, error: 'FORBIDDEN' })
        return
      }

      if (data.eventId && dedup.has(data.eventId)) {
        ack({ ok: true })
        return
      }
      if (data.eventId) dedup.add(data.eventId)

      try {
        if (data.status === 'offline') {
          leaveRoom(socket, RoomPatterns.DELIVERY())
        } else {
          joinRoom(socket, RoomPatterns.DELIVERY())
        }

        const event = data.status === 'offline' ? EVENTS.PARTNER_OFFLINE : EVENTS.PARTNER_ONLINE
        broadcastToRoom(adminNsp, RoomPatterns.ADMIN(), event, buildEvent({ partnerId: userId, status: data.status }))

        metrics.increment('socket_events_total', { event: 'PARTNER_STATUS', result: 'success' })
        ack({ ok: true })
      } catch (err) {
        log.error({ err, userId }, 'PARTNER_STATUS handler error')
        metrics.increment('socket_events_total', { event: 'PARTNER_STATUS', result: 'error' })
        ack({ ok: false, error: 'INTERNAL_ERROR' })
      }
    })

    // ── v1:PARTNER:LOCATION — delivery partner sends GPS coords ──────────────
    socket.on(EVENTS.PARTNER_LOCATION, async (
      data: { orderId: string; lat: number; lng: number; accuracy?: number; eventId?: string },
      ack: AckFn,
    ) => {
      if (role !== 'delivery') {
        ack({ ok: false, error: 'FORBIDDEN' })
        return
      }
      if (data.eventId && dedup.has(data.eventId)) {
        ack({ ok: true })
        return
      }
      if (data.eventId) dedup.add(data.eventId)

      try {
        // Store latest location in Redis only — overwrite, no history, no DB write.
        // Falls back silently if Redis is unavailable.
        setOrderLocation(data.orderId, {
          lat: data.lat,
          lng: data.lng,
          ...(data.accuracy !== undefined && { accuracy: data.accuracy }),
        }).catch(() => {})

        const payload = buildEvent<Omit<PartnerLocationPayload, keyof BaseEventPayload>>({
          orderId: data.orderId,
          lat: data.lat,
          lng: data.lng,
          ...(data.accuracy !== undefined && { accuracy: data.accuracy }),
        })

        // Broadcast to everyone tracking this order (customer + admin)
        broadcastToRoom(nsp, RoomPatterns.ORDER(data.orderId), EVENTS.ORDER_LOCATION_UPDATED, payload)
        broadcastToRoom(adminNsp, RoomPatterns.ADMIN(), EVENTS.ORDER_LOCATION_UPDATED, payload)

        ack({ ok: true })
      } catch (err) {
        log.error({ err, orderId: data.orderId, userId }, 'PARTNER_LOCATION handler error')
        ack({ ok: false, error: 'INTERNAL_ERROR' })
      }
    })

    // ── v1:CART:UPDATED — customer cart sync across devices ──────────────
    socket.on(EVENTS.CART_UPDATED, async (
      data: { 
        userId: string
        action: 'ADD' | 'REMOVE' | 'UPDATE' | 'CLEAR'
        productId?: string
        quantity?: number
        eventId?: string 
      },
      ack?: any,
    ) => {
      const sendAck = typeof ack === 'function' ? ack : () => {}
      
      if (role !== 'customer') {
        sendAck({ ok: false, error: 'FORBIDDEN' })
        return
      }

      // Don't dedup - we want to broadcast all cart changes
      try {
        // Broadcast to all other customer sockets for this user
        const userRoom = RoomPatterns.USER(userId)
        const event = buildEvent({
          userId,
          action: data.action,
          productId: data.productId,
          quantity: data.quantity,
        })
        
        // Send to user's personal room (all their devices)
        broadcastToRoom(nsp, userRoom, EVENTS.CART_UPDATED, event)
        
        sendAck({ ok: true })
      } catch (err) {
        log.error({ err, userId }, 'CART_UPDATED handler error')
        sendAck({ ok: false, error: 'INTERNAL_ERROR' })
      }
    })

    // ── Disconnect cleanup ─────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      log.info({ socketId: socket.id, userId, role, reason }, 'Order namespace: socket disconnected')
      if (role === 'delivery') {
        // Fix 3b: PARTNER:OFFLINE goes to admin:dashboard, not delivery:pool
        broadcastToRoom(
          adminNsp,
          RoomPatterns.ADMIN(),
          EVENTS.PARTNER_OFFLINE,
          buildEvent({ partnerId: userId }),
        )
        // Notify customers tracking the order this partner was delivering
        // socket.rooms is cleared before disconnect fires — use socket.data instead
        const activeRoom = socket.data.activeOrderRoom as string | undefined
        if (activeRoom) {
          broadcastToRoom(nsp, activeRoom, EVENTS.PARTNER_OFFLINE, buildEvent({ partnerId: userId }))
        }
      }
    })
  })
}
