import { v4 as uuidv4 } from 'uuid'
import type { OrderStatus, OrderItem, DeliveryAddress } from '../../types/global.types'

// ─── Versioned event name constants ──────────────────────────────────────────
// Format: v{N}:DOMAIN:ACTION
// Version bumped when payload shape changes — never silently breaking.
// Client declares supported versions in handshake: auth.versions: ['v1']
export const EVENTS = {
  // Server → Client
  ORDER_NEW: 'v1:ORDER:NEW',
  ORDER_ACCEPTED: 'v1:ORDER:ACCEPTED',
  ORDER_STATUS_UPDATED: 'v1:ORDER:STATUS_UPDATED',
  ORDER_CANCELLED: 'v1:ORDER:CANCELLED',
  PARTNER_ONLINE: 'v1:PARTNER:ONLINE',
  PARTNER_OFFLINE: 'v1:PARTNER:OFFLINE',
  SYSTEM_ERROR: 'v1:SYSTEM:ERROR',
  // Client → Server
  ORDER_ACCEPT: 'v1:ORDER:ACCEPT',
  ORDER_UPDATE_STATUS: 'v1:ORDER:UPDATE_STATUS',
  PARTNER_STATUS: 'v1:PARTNER:STATUS',
  PARTNER_LOCATION: 'v1:PARTNER:LOCATION',
  // Server → Client
  ORDER_LOCATION_UPDATED: 'v1:ORDER:LOCATION_UPDATED',
  // Product events
  PRODUCT_CREATED: 'v1:PRODUCT:CREATED',
  PRODUCT_UPDATED: 'v1:PRODUCT:UPDATED',
  PRODUCT_DELETED: 'v1:PRODUCT:DELETED',
  // Wallet events
  WALLET_UPDATED: 'v1:WALLET:UPDATED',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

// ─── Base payload — every event extends this ──────────────────────────────────
export interface BaseEventPayload {
  version: 'v1'
  eventId: string    // UUID v4 — enables client-side deduplication
  timestamp: string  // ISO 8601
}

// ─── Domain payloads ──────────────────────────────────────────────────────────
export interface OrderNewPayload extends BaseEventPayload {
  orderId: string
  customerId: string
  items: OrderItem[]
  totalAmount: number
  address: DeliveryAddress
}

export interface OrderAcceptedPayload extends BaseEventPayload {
  orderId: string
  deliveryPartnerId: string
  partnerName: string
}

export interface OrderStatusUpdatedPayload extends BaseEventPayload {
  orderId: string
  status: string  // string to accept any OrderStatus value
  actorId: string
  updatedAt: string
}

export interface OrderCancelledPayload extends BaseEventPayload {
  orderId: string
  actorId: string
  reason?: string
  deliveryPartnerId?: string
}

export interface PartnerOnlinePayload extends BaseEventPayload {
  partnerId: string
}

export interface SystemErrorPayload extends BaseEventPayload {
  code: string
  message: string
}

export interface PartnerLocationPayload extends BaseEventPayload {
  orderId: string
  lat: number
  lng: number
  accuracy?: number
}

// Product payloads
export interface ProductCreatedPayload extends BaseEventPayload {
  productId: string
  name: string
  category: string
  price: number
  stock: number
  isActive: boolean
}

export interface ProductUpdatedPayload extends BaseEventPayload {
  productId: string
  name: string
  category: string
  price: number
  stock: number
  isActive: boolean
}

export interface ProductDeletedPayload extends BaseEventPayload {
  productId: string
}

// Wallet payloads
export interface WalletUpdatedPayload extends BaseEventPayload {
  userId: string
  balance: number
  delta: number
  type: string
}

// ─── buildEvent — always use this, never hand-build payloads ─────────────────
// Guarantees every emitted event carries version, eventId, and timestamp.
/**
 * VERSION MIGRATION PROTOCOL
 * To add v2 events:
 * 1. Define new payload type: interface OrderAcceptedV2Payload extends BaseEventPayload { ... }
 * 2. Add new event name constant: ORDER_ACCEPTED_V2: 'v2:ORDER:ACCEPTED'
 * 3. Update buildEvent to accept a version param: buildEvent(payload, version: 'v1' | 'v2' = 'v1')
 * 4. In handlers: emit BOTH v1 and v2 events simultaneously during the rollout window
 * 5. After all clients have updated to v2: remove the v1 emit
 * Client declares supported versions in handshake: { token, versions: ['v1'] }
 * Server checks socket.data.versions before deciding which version to emit.
 * The 'v1' string is hardcoded in buildEvent below — change it here when bumping.
 */
export function buildEvent<T extends object>(partialPayload: T): T & BaseEventPayload {
  return {
    version: 'v1',
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
    ...partialPayload,
  }
}

// ─── Room naming conventions ──────────────────────────────────────────────────
export const RoomPatterns = {
  USER: (userId: string) => `user:${userId}`,
  ORDER: (orderId: string) => `order:${orderId}`,
  DELIVERY: () => 'delivery:pool',
  ADMIN: () => 'admin:dashboard',
}
