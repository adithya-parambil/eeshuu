import { z } from 'zod'
import { orderReadRepo } from '../../repositories/read/order.read-repo'
import { log } from '../../utils/logger'
import type { UseCaseContext, PaginatedResult } from '../../types/global.types'
import type { OrderDocument } from '../../repositories/models/order.model'

export const AdminOrderFiltersDto = z.object({
  page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(Number(v), 100) : 20)),
  status: z.string().trim().optional(),
  customerId: z.string().trim().optional(),
  deliveryPartnerId: z.string().trim().optional(),
})

export type AdminOrderFiltersDtoType = z.infer<typeof AdminOrderFiltersDto>

export class ListAllOrdersUseCase {
  async execute(
    dto: AdminOrderFiltersDtoType,
    _ctx: UseCaseContext,
  ): Promise<PaginatedResult<OrderDocument>> {
    log.info({ requestId: _ctx.requestId }, 'ListAllOrdersUseCase: start')
    const result = await orderReadRepo.listAll(dto)
    log.info({ requestId: _ctx.requestId }, 'ListAllOrdersUseCase: complete')
    return result
  }
}

export const listAllOrdersUseCase = new ListAllOrdersUseCase()
