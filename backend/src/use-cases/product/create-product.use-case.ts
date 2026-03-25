import { z } from 'zod'
import { productWriteRepo } from '../../repositories/write/product.write-repo'
import { cacheService } from '../../utils/cache-service'
import { log } from '../../utils/logger'
import type { UseCaseContext } from '../../types/global.types'
import type { ProductDocument } from '../../repositories/models/product.model'

export const CreateProductDto = z.object({
  name: z.string().trim().min(1).max(500),
  description: z.string().trim().max(2000).optional(),
  price: z.number().min(0),
  category: z.string().trim().min(1).max(100),
  stock: z.number().int().min(0),
  imageUrl: z.string().url().optional(),
})

export type CreateProductDtoType = z.infer<typeof CreateProductDto>

export class CreateProductUseCase {
  async execute(dto: CreateProductDtoType, ctx: UseCaseContext): Promise<ProductDocument> {
    log.info({ requestId: ctx.requestId }, 'CreateProductUseCase: start')
    const product = await productWriteRepo.create(dto)
    // Invalidate product list caches
    await cacheService.invalidatePattern('products:list:')
    log.info({ productId: String(product._id), requestId: ctx.requestId }, 'CreateProductUseCase: complete')
    return product
  }
}

export const createProductUseCase = new CreateProductUseCase()
