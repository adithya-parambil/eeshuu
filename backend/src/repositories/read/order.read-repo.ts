import mongoose from 'mongoose'
import { OrderModel, OrderDocument } from '../models/order.model'
import type { PaginatedResult } from '../../types/global.types'

export interface OrderFilters {
  page?: number
  limit?: number
  status?: string
}

export interface AdminOrderFilters extends OrderFilters {
  customerId?: string
  deliveryPartnerId?: string
}

/**
 * OrderReadRepository — CQRS read side.
 * Only query operations. Swap the Mongoose connection to a read replica
 * in db.config.ts and all read queries are automatically redirected.
 */
export class OrderReadRepository {
  async findById(orderId: string): Promise<OrderDocument | null> {
    return OrderModel.findById(orderId)
      .populate('customerId', 'name email phone')
      .populate('deliveryPartnerId', 'name phone')
  }

  async listByCustomer(
    customerId: string,
    filters: OrderFilters,
  ): Promise<PaginatedResult<OrderDocument>> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 10
    const skip = (page - 1) * limit

    const query: Record<string, unknown> = { customerId: { $eq: customerId } }
    if (filters.status) query['status'] = { $eq: filters.status }

    const [items, total] = await Promise.all([
      OrderModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      OrderModel.countDocuments(query),
    ])
    return { items, total, page, limit }
  }

  /** Returns PENDING orders with no delivery partner — the delivery pool */
  async listAvailable(): Promise<OrderDocument[]> {
    return OrderModel.find({
      status: { $eq: 'PENDING' },
      deliveryPartnerId: { $eq: null },
    }).sort({ createdAt: 1 })
  }

  /** Returns the active (non-terminal) order for a delivery partner */
  async findActiveByDeliveryPartner(deliveryPartnerId: string): Promise<OrderDocument | null> {
    const partnerId = new mongoose.Types.ObjectId(deliveryPartnerId)
    return OrderModel.findOne({
      deliveryPartnerId: { $eq: partnerId },
      // Exclude orders where the partner is also the customer (demo data edge case)
      customerId: { $ne: partnerId },
      status: { $in: ['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'] },
    })
      .populate('customerId', 'name email phone')
      .sort({ updatedAt: -1 })
  }

  /** Paginated order history for a delivery partner */
  async listByDeliveryPartner(
    deliveryPartnerId: string,
    filters: OrderFilters,
  ): Promise<PaginatedResult<OrderDocument>> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const skip = (page - 1) * limit
    const query: Record<string, unknown> = { deliveryPartnerId: { $eq: deliveryPartnerId } }
    if (filters.status) query['status'] = { $eq: filters.status }
    const [items, total] = await Promise.all([
      OrderModel.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('customerId', 'name'),
      OrderModel.countDocuments(query),
    ])
    return { items, total, page, limit }
  }

  /** Earnings stats for a delivery partner — commission is 10% of order value */
  async getDeliveryEarnings(deliveryPartnerId: string): Promise<{
    totalDeliveries: number
    totalEarnings: number
    fastestDeliveryMinutes: number | null
    avgDeliveryMinutes: number | null
    thisMonthDeliveries: number
    thisMonthEarnings: number
  }> {
    const COMMISSION_RATE = 0.10

    const delivered = await OrderModel.find({
      deliveryPartnerId: { $eq: deliveryPartnerId },
      status: 'DELIVERED',
    }).select('totalAmount pricing statusHistory createdAt')

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    let totalEarnings = 0
    let thisMonthDeliveries = 0
    let thisMonthEarnings = 0
    const deliveryTimes: number[] = []

    for (const order of delivered) {
      const commission = (order.pricing?.subtotal ?? order.totalAmount) * COMMISSION_RATE
      totalEarnings += commission

      const acceptedEntry = order.statusHistory.find((h) => h.status === 'ACCEPTED')
      const deliveredEntry = order.statusHistory.find((h) => h.status === 'DELIVERED')
      if (acceptedEntry && deliveredEntry) {
        const mins = (new Date(deliveredEntry.timestamp).getTime() - new Date(acceptedEntry.timestamp).getTime()) / 60000
        if (mins > 0) deliveryTimes.push(mins)
      }

      if (new Date(order.createdAt) >= monthStart) {
        thisMonthDeliveries++
        thisMonthEarnings += commission
      }
    }

    return {
      totalDeliveries: delivered.length,
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      fastestDeliveryMinutes: deliveryTimes.length ? parseFloat(Math.min(...deliveryTimes).toFixed(1)) : null,
      avgDeliveryMinutes: deliveryTimes.length ? parseFloat((deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length).toFixed(1)) : null,
      thisMonthDeliveries,
      thisMonthEarnings: parseFloat(thisMonthEarnings.toFixed(2)),
    }
  }

  async listAll(filters: AdminOrderFilters): Promise<PaginatedResult<OrderDocument>> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const skip = (page - 1) * limit

    const query: Record<string, unknown> = {}
    if (filters.status) query['status'] = { $eq: filters.status }
    if (filters.customerId) query['customerId'] = { $eq: filters.customerId }
    if (filters.deliveryPartnerId)
      query['deliveryPartnerId'] = { $eq: filters.deliveryPartnerId }

    const [items, total] = await Promise.all([
      OrderModel.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('customerId', 'name email')
        .populate('deliveryPartnerId', 'name phone'),
      OrderModel.countDocuments(query),
    ])
    return { items, total, page, limit }
  }
}

export const orderReadRepo = new OrderReadRepository()
