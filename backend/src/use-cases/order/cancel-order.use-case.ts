import { EventEmitter } from 'events'
import { NotFoundError, ForbiddenError } from '../../utils/app-error'
import { orderWriteRepo } from '../../repositories/write/order.write-repo'
import { orderReadRepo } from '../../repositories/read/order.read-repo'
import { orderService } from '../../services/order.service'
import { cacheService } from '../../utils/cache-service'
import { log } from '../../utils/logger'
import { orderEventEmitter } from '../../utils/order-event-emitter'
import type { OrderStatus, UseCaseContext } from '../../types/global.types'
import type { OrderDocument } from '../../repositories/models/order.model'

export interface CancelOrderDto {
  orderId: string
  reason?: string
}

export class CancelOrderUseCase {
  constructor(private readonly eventEmitter: EventEmitter = orderEventEmitter) {}

  async execute(
    dto: CancelOrderDto,
    ctx: UseCaseContext & { actorId: string; actorRole: string },
  ): Promise<OrderDocument> {
    log.info({ requestId: ctx.requestId, actorId: ctx.actorId }, 'CancelOrderUseCase: start')
    const current = await orderReadRepo.findById(dto.orderId)
    if (!current) {
      throw new NotFoundError(`Order ${dto.orderId} not found`, 'ORDER_NOT_FOUND')
    }

    // Customers may only cancel their own orders
    // customerId may be a populated User doc — extract _id if so
    if (ctx.actorRole === 'customer') {
      const orderCustomerId =
        current.customerId &&
        typeof current.customerId === 'object' &&
        '_id' in (current.customerId as object)
          ? String((current.customerId as { _id: unknown })._id)
          : String(current.customerId)

      if (orderCustomerId !== ctx.actorId) {
        throw new ForbiddenError('Not your order', 'FORBIDDEN')
      }
    }

    // Validate transition — can only cancel from PENDING or ACCEPTED
    orderService.validateTransition(current.status as OrderStatus, 'CANCELLED')

    const cancelled = await orderWriteRepo.cancel(dto.orderId, ctx.actorId, dto.reason)

    if (!cancelled) {
      throw new NotFoundError(`Order ${dto.orderId} not found after cancel`, 'ORDER_NOT_FOUND')
    }
    await cacheService.del(`order:${dto.orderId}`)
    await cacheService.invalidatePattern('orders:available')

    this.eventEmitter.emit('order.cancelled', {
      orderId: dto.orderId,
      customerId: String(cancelled.customerId),
      actorId: ctx.actorId,
      reason: dto.reason,
      deliveryPartnerId: cancelled.deliveryPartnerId ? String(cancelled.deliveryPartnerId) : undefined,
    })

    log.info({ orderId: dto.orderId, actorId: ctx.actorId, requestId: ctx.requestId }, 'CancelOrderUseCase: complete')
    return cancelled
  }
}

export const cancelOrderUseCase = new CancelOrderUseCase()
