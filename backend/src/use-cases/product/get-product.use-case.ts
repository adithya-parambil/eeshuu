import { NotFoundError } from '../../utils/app-error'
import { productReadRepo } from '../../repositories/read/product.read-repo'
import { log } from '../../utils/logger'
import type { UseCaseContext } from '../../types/global.types'
import type { ProductDocument } from '../../repositories/models/product.model'

export class GetProductUseCase {
  async execute(productId: string, _ctx: UseCaseContext): Promise<ProductDocument> {
    log.info({ requestId: _ctx.requestId, productId }, 'GetProductUseCase: start')
    const product = await productReadRepo.findById(productId)
    if (!product || !product.isActive) {
      throw new NotFoundError(`Product ${productId} not found`, 'PRODUCT_NOT_FOUND')
    }
    log.info({ requestId: _ctx.requestId, productId }, 'GetProductUseCase: complete')
    return product
  }
}

export const getProductUseCase = new GetProductUseCase()
