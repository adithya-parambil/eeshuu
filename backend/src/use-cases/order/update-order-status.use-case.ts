import { z } from 'zod'
import { EventEmitter } from 'events'
import { NotFoundError, ForbiddenError } from '../../utils/app-error'
import { orderWriteRepo } from '../../repositories/write/order.write-repo'
import { userWriteRepo } from '../../repositories/write/user.write-repo'
import { orderReadRepo } from '../../repositories/read/order.read-repo'
import { orderService, PRICING } from '../../services/order.service'
import { cacheService } from '../../utils/cache-service'
import { withTransaction } from '../../utils/transaction'
import { log } from '../../utils/logger'
import type { OrderStatus, UseCaseContext } from '../../types/global.types'
import type { OrderDocument } from '../../repositories/models/order.model'

export const UpdateStatusDto = z.object({
  orderId: z.string().trim().min(1),
  status: z.enum(['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED']),
  note: z.string().trim().max(500).optional(),
})

export type UpdateStatusDtoType = z.infer<typeof UpdateStatusDto>

export class UpdateOrderStatusUseCase {
  constructor(private readonly eventEmitter: EventEmitter = new EventEmitter()) {}

  async execute(
    dto: UpdateStatusDtoType,
    ctx: UseCaseContext & { actorId: string; actorRole: string },
  ): Promise<OrderDocument> {
    log.info({ requestId: ctx.requestId, actorId: ctx.actorId }, 'UpdateOrderStatusUseCase: start')
    const current = await orderReadRepo.findById(dto.orderId)
    if (!current) {
      throw new NotFoundError(`Order ${dto.orderId} not found`, 'ORDER_NOT_FOUND')
    }

    // Delivery partners may only update orders they own
    // deliveryPartnerId may be a populated User doc or a raw ObjectId — handle both
    if (ctx.actorRole === 'delivery') {
      const rawId = current.deliveryPartnerId
      const orderDeliveryId = rawId
        ? (rawId as any)._id
          ? String((rawId as any)._id)
          : String(rawId)
        : null

      if (!orderDeliveryId || orderDeliveryId !== ctx.actorId) {
        throw new ForbiddenError('Not your order', 'FORBIDDEN')
      }
    }

    // Enforce state machine rules
    orderService.validateTransition(current.status as OrderStatus, dto.status as OrderStatus)

    const updated = await withTransaction(async (session) => {
      const doc = await orderWriteRepo.updateStatus(dto.orderId, dto.status as OrderStatus, ctx.actorId, session, ctx.actorRole)
      if (!doc) return null

      // Credit delivery partner commission on DELIVERED
      if (dto.status === 'DELIVERED' && ctx.actorRole === 'delivery') {
        const subtotal = doc.pricing?.subtotal ?? doc.totalAmount
        const commission = parseFloat((subtotal * PRICING.COMMISSION_RATE).toFixed(2))
        await userWriteRepo.adjustWallet(ctx.actorId, commission, session, {
          type: 'COMMISSION',
          orderId: dto.orderId,
          note: `Commission for order ${dto.orderId}`,
        })
      }

      return doc
    })

    if (!updated) {
      throw new NotFoundError(`Order ${dto.orderId} not found after update`, 'ORDER_NOT_FOUND')
    }

    await cacheService.del(`order:${dto.orderId}`)

    this.eventEmitter.emit('order.status_updated', {
      orderId: dto.orderId,
      status: dto.status,
      actorId: ctx.actorId,
      updatedAt: updated.updatedAt,
    })

    log.info(
      { orderId: dto.orderId, status: dto.status, actorId: ctx.actorId, requestId: ctx.requestId },
      'UpdateOrderStatusUseCase: complete',
    )
    return updated
  }
}

export const updateOrderStatusUseCase = new UpdateOrderStatusUseCase()
