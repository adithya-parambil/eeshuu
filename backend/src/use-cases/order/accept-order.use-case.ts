import { orderWriteRepo } from '../../repositories/write/order.write-repo'
import { orderReadRepo } from '../../repositories/read/order.read-repo'
import { cacheService } from '../../utils/cache-service'
import { log } from '../../utils/logger'
import { metrics } from '../../utils/metrics'
import { ConflictError } from '../../utils/app-error'
import { orderEventEmitter } from '../../utils/order-event-emitter'
import type { UseCaseContext } from '../../types/global.types'
import type { OrderDocument } from '../../repositories/models/order.model'

export interface AcceptOrderDto {
  orderId: string
  deliveryPartnerId: string
}

export class AcceptOrderUseCase {
  constructor(private readonly eventEmitter = orderEventEmitter) {}

  /**
   * Atomically claims an order for a delivery partner.
   * Returns null if another partner won the race — caller must handle this.
   * DB write always completes before any event is emitted.
   */
  async execute(
    dto: AcceptOrderDto,
    ctx: UseCaseContext,
  ): Promise<OrderDocument | null> {
    log.info({ requestId: ctx.requestId, orderId: dto.orderId }, 'AcceptOrderUseCase: start')

    // ── Enforce one active order per delivery partner ──────────────────────
    const existing = await orderReadRepo.findActiveByDeliveryPartner(dto.deliveryPartnerId)
    if (existing) {
      throw new ConflictError(
        'You already have an active order. Complete it before accepting another.',
        'PARTNER_HAS_ACTIVE_ORDER',
      )
    }

    const order = await orderWriteRepo.acceptOrder(
      dto.orderId,
      dto.deliveryPartnerId,
    )

    // null = ORDER_ALREADY_TAKEN — another partner won the atomic race
    if (!order) return null

    // Invalidate caches — delivery pool and specific order
    await cacheService.invalidatePattern('orders:available')
    await cacheService.del(`order:${dto.orderId}`)

    // Emit internal event for the socket layer AFTER the DB write confirms
    // Include customerId so order.namespace can broadcast to the customer's personal room
    const customerId = order.customerId
      ? (order.customerId as any)._id
        ? String((order.customerId as any)._id)
        : String(order.customerId)
      : ''
    this.eventEmitter.emit('order.accepted', {
      orderId: dto.orderId,
      deliveryPartnerId: dto.deliveryPartnerId,
      customerId,
      partnerName: dto.deliveryPartnerId, // name not available here; namespace will use id
    })

    metrics.increment('socket_events_total', { event: 'ORDER_ACCEPT', result: 'success' })
    log.info(
      { orderId: dto.orderId, deliveryPartnerId: dto.deliveryPartnerId, requestId: ctx.requestId },
      'AcceptOrderUseCase: complete',
    )
    return order
  }
}

export const acceptOrderUseCase = new AcceptOrderUseCase()
