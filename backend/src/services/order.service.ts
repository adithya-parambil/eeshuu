import { ConflictError } from '../utils/app-error'
import { VALID_TRANSITIONS } from '../types/global.types'
import type { OrderStatus, StatusHistoryEntry } from '../types/global.types'
import type { OrderPricing } from '../repositories/models/order.model'

// ─── Pricing constants ────────────────────────────────────────────────────────
export const PRICING = {
  TAX_RATE: 0.05,       // GST 5%
  DELIVERY_FEE: 25,     // flat ₹25
  PLATFORM_FEE: 5,      // flat ₹5
  COMMISSION_RATE: 0.10, // 10% of subtotal to delivery partner
} as const

/**
 * OrderService — state machine enforcement and order business rules.
 * Called only by use-cases — never by controllers or socket handlers.
 */
export class OrderService {
  /**
   * Validates that a state transition is legal.
   * Throws ConflictError with INVALID_STATE_TRANSITION code if not.
   */
  validateTransition(current: OrderStatus, next: OrderStatus): void {
    const allowed = VALID_TRANSITIONS[current]
    if (!allowed.includes(next)) {
      throw new ConflictError(
        `Cannot transition order from ${current} to ${next}`,
        'INVALID_STATE_TRANSITION',
      )
    }
  }

  /** Calculate full pricing breakdown from line items */
  calculatePricing(items: Array<{ price: number; quantity: number }>): OrderPricing {
    const subtotal = parseFloat(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2))
    const tax = parseFloat((subtotal * PRICING.TAX_RATE).toFixed(2))
    const deliveryFee = PRICING.DELIVERY_FEE
    const platformFee = PRICING.PLATFORM_FEE
    const total = parseFloat((subtotal + tax + deliveryFee + platformFee).toFixed(2))
    return { subtotal, tax, deliveryFee, platformFee, total }
  }

  /** @deprecated use calculatePricing().subtotal */
  calculateTotal(items: Array<{ price: number; quantity: number }>): number {
    return this.calculatePricing(items).subtotal
  }

  /** Build a new status history entry — always append, never mutate */
  buildHistoryEntry(
    status: OrderStatus,
    actorId: string,
    note?: string,
  ): StatusHistoryEntry {
    return {
      status,
      timestamp: new Date(),
      actorId,
      ...(note !== undefined ? { note } : {}),
    }
  }
}

export const orderService = new OrderService()
