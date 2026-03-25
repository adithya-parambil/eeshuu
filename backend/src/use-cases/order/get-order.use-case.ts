import { NotFoundError, ForbiddenError } from '../../utils/app-error'
import { orderReadRepo } from '../../repositories/read/order.read-repo'
import { cacheService } from '../../utils/cache-service'
import { log } from '../../utils/logger'
import type { UseCaseContext } from '../../types/global.types'
import type { OrderDocument } from '../../repositories/models/order.model'

export interface GetOrderDto {
  orderId: string
}

export class GetOrderUseCase {
  async execute(
    dto: GetOrderDto,
    ctx: UseCaseContext & { requesterId: string; requesterRole: string },
  ): Promise<OrderDocument> {
    log.info({ requestId: ctx.requestId, requesterId: ctx.requesterId }, 'GetOrderUseCase: start')
    const cacheKey = `order:${dto.orderId}`
    const cached = await cacheService.get<OrderDocument>(cacheKey)
    if (cached) return cached

    const order = await orderReadRepo.findById(dto.orderId)
    if (!order) {
      throw new NotFoundError(`Order ${dto.orderId} not found`, 'ORDER_NOT_FOUND')
    }

    // Customers may only view their own orders.
    // customerId may be a populated User doc or a raw ObjectId — handle both.
    const orderCustomerId =
      order.customerId && typeof order.customerId === 'object' && '_id' in (order.customerId as object)
        ? String((order.customerId as { _id: unknown })._id)
        : String(order.customerId)

    if (ctx.requesterRole === 'customer' && orderCustomerId !== ctx.requesterId) {
      throw new ForbiddenError('Access denied', 'FORBIDDEN')
    }

    await cacheService.set(cacheKey, order, 60) // 60s cache
    log.info({ requestId: ctx.requestId, orderId: dto.orderId }, 'GetOrderUseCase: complete')
    return order
  }
}

export const getOrderUseCase = new GetOrderUseCase()
