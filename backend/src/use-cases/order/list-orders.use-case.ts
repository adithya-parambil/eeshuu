import { orderReadRepo } from '../../repositories/read/order.read-repo'
import { log } from '../../utils/logger'
import type { UseCaseContext, PaginatedResult } from '../../types/global.types'
import type { OrderDocument } from '../../repositories/models/order.model'

export interface ListOrdersDto {
  page?: number
  limit?: number
  status?: string
}

export class ListOrdersUseCase {
  async execute(
    dto: ListOrdersDto,
    ctx: UseCaseContext & { customerId: string },
  ): Promise<PaginatedResult<OrderDocument>> {
    log.info({ requestId: ctx.requestId, customerId: ctx.customerId }, 'ListOrdersUseCase: start')
    const result = await orderReadRepo.listByCustomer(ctx.customerId, {
      page: dto.page ?? 1,
      limit: Math.min(dto.limit ?? 10, 50), // cap at 50
      status: dto.status,
    })
    log.info({ requestId: ctx.requestId }, 'ListOrdersUseCase: complete')
    return result
  }
}

export const listOrdersUseCase = new ListOrdersUseCase()
