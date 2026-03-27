import mongoose from 'mongoose'
import { OrderModel, OrderDocument } from '../models/order.model'
import type {
  OrderStatus,
  OrderItem,
  DeliveryAddress,
} from '../../types/global.types'
import type { OrderPricing } from '../models/order.model'

export interface CreateOrderData {
  customerId: string
  items: OrderItem[]
  pricing: OrderPricing
  totalAmount: number
  deliveryAddress: DeliveryAddress
  idempotencyKey?: string
}

/**
 * OrderWriteRepository — CQRS write side.
 * Only mutation operations. Never called by controllers or handlers.
 */
export class OrderWriteRepository {
  async create(
    data: CreateOrderData,
    session?: mongoose.ClientSession,
  ): Promise<OrderDocument> {
    const statusHistory = [{ status: 'PENDING' as OrderStatus, timestamp: new Date(), actorId: data.customerId }]
    const [order] = await OrderModel.create(
      [{ ...data, status: 'PENDING', statusHistory }],
      session ? { session } : {},
    )
    if (!order) throw new Error('Order creation failed unexpectedly')
    return order
  }

  /**
   * Atomic accept — uses findOneAndUpdate with a compound filter to guarantee
   * only one delivery partner can claim the order. Returns null if the order
   * was already claimed by someone else (race condition handled at use-case level).
   */
  async acceptOrder(
    orderId: string,
    deliveryPartnerId: string,
  ): Promise<OrderDocument | null> {
    return OrderModel.findOneAndUpdate(
      {
        _id: { $eq: new mongoose.Types.ObjectId(orderId) },
        status: { $eq: 'PENDING' },
        deliveryPartnerId: { $eq: null },
      },
      {
        $set: {
          deliveryPartnerId: new mongoose.Types.ObjectId(deliveryPartnerId),
          status: 'ACCEPTED',
          lockedAt: new Date(),
        },
        $push: {
          statusHistory: {
            status: 'ACCEPTED',
            timestamp: new Date(),
            actorId: deliveryPartnerId,
          },
        },
      },
      { new: true },
    )
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    actorId: string,
    session?: mongoose.ClientSession,
    actorRole?: string,
  ): Promise<OrderDocument | null> {
    // For delivery partners: compound filter ensures only the assigned partner can update
    // For admins: filter by orderId only
    // filter includes status: { $ne: status } to prevent duplicate history entries
    const filter: Record<string, unknown> = { 
      _id: { $eq: new mongoose.Types.ObjectId(orderId) },
      status: { $ne: status }
    }
    if (actorRole === 'delivery') {
      filter['deliveryPartnerId'] = { $eq: new mongoose.Types.ObjectId(actorId) }
    }

    return OrderModel.findOneAndUpdate(
      filter,
      {
        $set: { status },
        $push: {
          statusHistory: {
            status,
            timestamp: new Date(),
            actorId,
          },
        },
      },
      { new: true, session },
    )
  }

  async cancel(
    orderId: string,
    actorId: string,
    reason?: string,
    session?: mongoose.ClientSession,
  ): Promise<OrderDocument | null> {
    return OrderModel.findByIdAndUpdate(
      orderId,
      {
        $set: {
          status: 'CANCELLED',
          ...(reason ? { cancelReason: reason } : {}),
        },
        $push: {
          statusHistory: {
            status: 'CANCELLED',
            timestamp: new Date(),
            actorId,
            note: reason,
          },
        },
      },
      { new: true, session },
    )
  }

}

export const orderWriteRepo = new OrderWriteRepository()
