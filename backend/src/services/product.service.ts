import { NotFoundError, ConflictError } from '../utils/app-error'
import { productReadRepo } from '../repositories/read/product.read-repo'
import type { ProductDocument } from '../repositories/models/product.model'

/**
 * ProductService — stock checks and catalog business rules.
 * Called only by use-cases — never by controllers or socket handlers.
 */
export class ProductService {
  /**
   * Verifies a product exists, is active, and has sufficient stock.
   * Throws NotFoundError or ConflictError as appropriate.
   */
  async validateStock(productId: string, quantity: number): Promise<ProductDocument> {
    const product = await productReadRepo.findById(productId)
    if (!product || !product.isActive) {
      throw new NotFoundError(`Product ${productId} not found`, 'PRODUCT_NOT_FOUND')
    }
    if (product.stock < quantity) {
      throw new ConflictError(
        `Insufficient stock for product ${product.name}`,
        'INSUFFICIENT_STOCK',
      )
    }
    return product
  }
}

export const productService = new ProductService()
