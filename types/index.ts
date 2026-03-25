// ─── Domain types (mirrors backend) ──────────────────────────────────────────

export type UserRole = 'customer' | 'delivery' | 'admin'

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED'

export interface User {
  _id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  isActive: boolean
  createdAt: string
}

export interface Product {
  _id: string
  name: string
  description?: string
  price: number
  category: string
  stock: number
  imageUrl?: string
  isActive: boolean
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

export interface DeliveryAddress {
  line1: string
  city: string
  pincode: string
  lat?: number
  lng?: number
}

export interface DeliveryAddressWithCoords extends DeliveryAddress {
  lat: number
  lng: number
}

export interface GeocodeSuggestion {
  displayName: string
  lat: number
  lng: number
  placeId: string
}

export interface GeocodeResult {
  lat: number
  lng: number
  formattedAddress: string
}

export interface GeocodeCache {
  [key: string]: {
    result: GeocodeResult
    timestamp: number
  }
}

export interface StatusHistoryEntry {
  status: OrderStatus
  timestamp: string
  actorId: string
  note?: string
}

export interface Order {
  _id: string
  orderId?: string
  customerId: string | { _id: string; name: string; email: string; phone?: string }
  deliveryPartnerId?: string | { _id: string; name: string; phone?: string }
  items: OrderItem[]
  pricing?: OrderPricing
  totalAmount: number
  deliveryAddress: DeliveryAddress
  status: OrderStatus
  statusHistory: StatusHistoryEntry[]
  cancelReason?: string
  partnerLocation?: { lat: number; lng: number; updatedAt: string }
  createdAt: string
  updatedAt: string
}

export interface OrderPricing {
  subtotal: number
  tax: number
  deliveryFee: number
  platformFee: number
  total: number
}

export interface WalletBalance {
  balance: number
}

export interface WalletTransaction {
  _id: string
  userId: string
  type: 'COMMISSION' | 'WITHDRAWAL' | 'REFUND'
  amount: number
  balanceAfter: number
  orderId?: string
  note?: string
  createdAt: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  userId: string
  name: string
  email: string
  role: UserRole
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface ApiMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: ApiMeta
  requestId: string
}

export interface ApiError {
  success: false
  message: string
  code: string
  errors?: { field: string; message: string }[]
  requestId: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product
  quantity: number
}

// ─── Dispute ──────────────────────────────────────────────────────────────────

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'

export interface Dispute {
  _id: string
  orderId: string | { _id: string; totalAmount: number; status: OrderStatus; createdAt: string }
  raisedBy: string | { _id: string; name: string; email: string; role: UserRole }
  raisedByRole: UserRole
  subject: string
  description: string
  status: DisputeStatus
  adminResponse?: string
  resolvedBy?: string | { _id: string; name: string }
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

// ─── Rating ───────────────────────────────────────────────────────────────────

export interface Rating {
  _id: string
  orderId: string
  customerId: string | { _id: string; name: string }
  deliveryPartnerId: string
  rating: number
  comment?: string
  createdAt: string
}

export interface PartnerRatings {
  ratings: Rating[]
  average: number
  count: number
}

// ─── Delivery earnings ────────────────────────────────────────────────────────

export interface DeliveryEarnings {
  totalDeliveries: number
  totalEarnings: number
  fastestDeliveryMinutes: number | null
  avgDeliveryMinutes: number | null
  thisMonthDeliveries: number
  thisMonthEarnings: number
}


export interface SystemStats {
  totalOrders: number
  ordersByStatus: Record<string, number>
  totalUsers: number
  usersByRole: Record<string, number>
  totalProducts: number
  activeProducts: number
  timestamp: string
}

// ─── Socket event payloads ────────────────────────────────────────────────────

export interface BaseEventPayload {
  version: 'v1'
  eventId: string
  timestamp: string
}

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
  status: OrderStatus
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
  status?: string
}
