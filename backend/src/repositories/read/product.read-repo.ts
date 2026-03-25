import { ProductModel, ProductDocument } from '../models/product.model'
import type { PaginatedResult } from '../../types/global.types'

export interface ProductFilters {
  page?: number
  limit?: number
  category?: string
  search?: string
  isActive?: boolean
}

export class ProductReadRepository {
  async findById(productId: string): Promise<ProductDocument | null> {
    return ProductModel.findById(productId)
  }

  async listPaginated(filters: ProductFilters): Promise<PaginatedResult<ProductDocument>> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const skip = (page - 1) * limit

    const query: Record<string, unknown> = { isActive: { $eq: filters.isActive ?? true } }
    if (filters.category) query['category'] = { $eq: filters.category }
    if (filters.search) query['$text'] = { $search: filters.search }

    const [items, total] = await Promise.all([
      ProductModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      ProductModel.countDocuments(query),
    ])
    return { items, total, page, limit }
  }

  async textSearch(query: string): Promise<ProductDocument[]> {
    return ProductModel.find({ $text: { $search: query }, isActive: { $eq: true } })
  }
}

export const productReadRepo = new ProductReadRepository()
