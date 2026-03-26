import { z } from 'zod'
import { EventEmitter } from 'events'
import { orderWriteRepo } from '../../repositories/write/order.write-repo'
import { productService } from '../../services/product.service'
import { orderService } from '../../services/order.service'
import { cacheService } from '../../utils/cache-service'
import { withTransaction } from '../../utils/transaction'
import { log } from '../../utils/logger'
import { metrics } from '../../utils/metrics'
import { orderEventEmitter } from '../../utils/order-event-emitter'
import type { UseCaseContext } from '../../types/global.types'
import type { OrderDocument } from '../../repositories/models/order.model'

export const PlaceOrderDto = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
  deliveryAddress: z.object({
    line1: z.string().trim().min(1).max(500),
    city: z.string().trim().min(1).max(100),
    pincode: z.string().trim().min(1).max(20),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  }),
})

export type PlaceOrderDtoType = z.infer<typeof PlaceOrderDto>

export class PlaceOrderUseCase {
  constructor(
    private readonly eventEmitter: EventEmitter = orderEventEmitter,
  ) {}

  async execute(
    dto: PlaceOrderDtoType,
    ctx: UseCaseContext & { customerId: string },
  ): Promise<OrderDocument> {
    log.info({ requestId: ctx.requestId, customerId: ctx.customerId }, 'PlaceOrderUseCase: start')

    const enrichedItems = await Promise.all(
      dto.items.map(async (item) => {
        const product = await productService.validateStock(item.productId, item.quantity)
        return {
          productId: item.productId,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
        }
      }),
    )

    const pricing = orderService.calculatePricing(enrichedItems)

    const order = await withTransaction(async (session) => {
      return orderWriteRepo.create(
        {
          customerId: ctx.customerId,
          items: enrichedItems,
          pricing,
          totalAmount: pricing.total,
          deliveryAddress: dto.deliveryAddress,
        },
        session,
      )
    })

    await cacheService.invalidatePattern('orders:available')

    this.eventEmitter.emit('order.placed', {
      orderId: String(order._id),
      customerId: ctx.customerId,
      items: enrichedItems,
      totalAmount: pricing.total,
      address: dto.deliveryAddress,
    })

    log.info({ orderId: String(order._id) }, 'order.placed event emitted')

    metrics.increment('order_placed_total', { role: 'customer' })
    log.info(
      { orderId: String(order._id), customerId: ctx.customerId, requestId: ctx.requestId },
      'PlaceOrderUseCase: complete',
    )
    return order
  }
}

export const placeOrderUseCase = new PlaceOrderUseCase()
