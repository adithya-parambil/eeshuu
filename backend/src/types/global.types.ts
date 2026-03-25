// ─── User roles ───────────────────────────────────────────────────────────────
export type UserRole = 'customer' | 'delivery' | 'admin'

// ─── Order state machine ──────────────────────────────────────────────────────
export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED'

export const ORDER_STATES: OrderStatus[] = [
  'PENDING',
  'ACCEPTED',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
  'CANCELLED',
]

/** Valid state transitions — each key maps to the states it may advance to */
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PICKED_UP'],
  PICKED_UP: ['ON_THE_WAY'],
  ON_THE_WAY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

// ─── Use-case execution context ───────────────────────────────────────────────
export interface UseCaseContext {
  requestId: string
  userId?: string
  session?: import('mongoose').ClientSession
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

// ─── Order domain types ───────────────────────────────────────────────────────
export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface DeliveryAddress {
  line1: string
  city: string
  pincode: string
}

export interface StatusHistoryEntry {
  status: OrderStatus
  timestamp: Date
  actorId: string
  note?: string
}

// ─── Max socket connections per user ─────────────────────────────────────────
export const MAX_SOCKET_CONNECTIONS = 5
