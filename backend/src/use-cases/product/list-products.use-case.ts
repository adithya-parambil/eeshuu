import { z } from 'zod'
import { productReadRepo } from '../../repositories/read/product.read-repo'
import { cacheService } from '../../utils/cache-service'
import { log } from '../../utils/logger'
import type { UseCaseContext, PaginatedResult } from '../../types/global.types'
import type { ProductDocument } from '../../repositories/models/product.model'

export const ProductFiltersDto = z.object({
  page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(Number(v), 50) : 20)),
  category: z.string().trim().max(100).optional(),
  search: z.string().trim().max(200).optional(),
})

export type ProductFiltersDtoType = z.infer<typeof ProductFiltersDto>

export class ListProductsUseCase {
  async execute(
    dto: ProductFiltersDtoType,
    _ctx: UseCaseContext,
  ): Promise<PaginatedResult<ProductDocument>> {
    log.info({ requestId: _ctx.requestId }, 'ListProductsUseCase: start')
    // Cache only non-search paginated lists
    if (!dto.search) {
      const cacheKey = `products:list:${dto.page}:${dto.limit}:${dto.category ?? ''}`
      const cached = await cacheService.get<PaginatedResult<ProductDocument>>(cacheKey)
      if (cached) {
        log.info({ requestId: _ctx.requestId }, 'ListProductsUseCase: complete (cache hit)')
        return cached
      }
      const result = await productReadRepo.listPaginated({ ...dto, isActive: true })
      await cacheService.set(cacheKey, result, 120) // 2 min cache
      log.info({ requestId: _ctx.requestId }, 'ListProductsUseCase: complete')
      return result
    }
    const result = await productReadRepo.listPaginated({ ...dto, isActive: true })
    log.info({ requestId: _ctx.requestId }, 'ListProductsUseCase: complete')
    return result
  }
}

export const listProductsUseCase = new ListProductsUseCase()
