import mongoose, { Document, Schema } from 'mongoose'
import type {
  OrderStatus,
  OrderItem,
  DeliveryAddress,
  StatusHistoryEntry,
} from '../../types/global.types'

export interface OrderPricing {
  subtotal: number
  tax: number        // GST 5%
  deliveryFee: number // flat ₹25
  platformFee: number // flat ₹5
  total: number
}

export interface PartnerLocation {
  lat: number
  lng: number
  updatedAt: Date
}

export interface OrderDocument extends Document {
  orderId: string
  customerId: mongoose.Types.ObjectId
  deliveryPartnerId: mongoose.Types.ObjectId | null
  items: OrderItem[]
  status: OrderStatus
  statusHistory: StatusHistoryEntry[]
  pricing: OrderPricing
  totalAmount: number
  deliveryAddress: DeliveryAddress
  partnerLocation?: PartnerLocation
  cancelReason?: string
  lockedAt: Date | null
  idempotencyKey?: string
  createdAt: Date
  updatedAt: Date
}

const orderItemSchema = new Schema<OrderItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
)

const statusHistorySchema = new Schema<StatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'],
      required: true,
    },
    timestamp: { type: Date, required: true, default: () => new Date() },
    actorId: { type: String, required: true },
    note: { type: String },
  },
  { _id: false },
)

const deliveryAddressSchema = new Schema<DeliveryAddress>(
  {
    line1: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    lat: { type: Number, required: false, min: -90, max: 90 },
    lng: { type: Number, required: false, min: -180, max: 180 },
  },
  { _id: false },
)

const pricingSchema = new Schema(
  {
    subtotal:    { type: Number, required: true, min: 0 },
    tax:         { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, required: true, min: 0 },
    total:       { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const partnerLocationSchema = new Schema(
  {
    lat:       { type: Number, required: true },
    lng:       { type: Number, required: true },
    updatedAt: { type: Date, required: true },
  },
  { _id: false },
)

// ── Short human-readable order ID generator ───────────────────────────────────
function generateOrderId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars (0/O, 1/I)
  let id = 'ORD-'
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

const orderSchema = new Schema<OrderDocument>(
  {
    orderId: {
      type: String,
      unique: true,
      default: generateOrderId,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deliveryPartnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    pricing: {
      type: pricingSchema,
      required: true,
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      required: true,
    },
    partnerLocation: {
      type: partnerLocationSchema,
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    idempotencyKey: {
      type: String,
      sparse: true, // allows multiple null values in unique index
    },
  },
  {
    timestamps: true,
    strict: true,
  },
)

// Compound index for efficient delivery pool queries
orderSchema.index({ status: 1, createdAt: -1 })
orderSchema.index({ customerId: 1 })
orderSchema.index({ deliveryPartnerId: 1 })

export const OrderModel = mongoose.model<OrderDocument>('Order', orderSchema)
