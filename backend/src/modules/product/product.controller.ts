import { Request, Response } from 'express'
import { asyncHandler } from '../../utils/async-handler'
import { ApiResponse } from '../../utils/response-builder'
import { createProductUseCase } from '../../use-cases/product/create-product.use-case'
import { getProductUseCase } from '../../use-cases/product/get-product.use-case'
import { listProductsUseCase, ProductFiltersDto } from '../../use-cases/product/list-products.use-case'
import { productWriteRepo } from '../../repositories/write/product.write-repo'
import { cacheService } from '../../utils/cache-service'
import { NotFoundError } from '../../utils/app-error'
import { productEventEmitter } from '../../utils/event-emitters'

export const productController = {
  listProducts: asyncHandler(async (req: Request, res: Response) => {
    const filters = ProductFiltersDto.parse(req.query)
    const result = await listProductsUseCase.execute(
      filters,
      { requestId: String(req.id) },
    )
    res.status(200).json(
      ApiResponse.success(result.items, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      }),
    )
  }),

  getProduct: asyncHandler(async (req: Request, res: Response) => {
    const product = await getProductUseCase.execute(
      req.params.productId,
      { requestId: String(req.id) },
    )
    res.status(200).json(ApiResponse.success(product))
  }),

  createProduct: asyncHandler(async (req: Request, res: Response) => {
    const product = await createProductUseCase.execute(req.body, { requestId: String(req.id) })
    await cacheService.invalidatePattern('products:list:')
    // Emit product.created event for real-time updates
    productEventEmitter.emit('product.created', {
      productId: product._id?.toString(),
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      isActive: product.isActive,
    })
    res.status(201).json(ApiResponse.success(product))
  }),

  updateProduct: asyncHandler(async (req: Request, res: Response) => {
    const updated = await productWriteRepo.update(req.params.productId, req.body)
    if (!updated) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND')
    await cacheService.invalidatePattern('products:list:')
    // Emit product.updated event for real-time updates
    productEventEmitter.emit('product.updated', {
      productId: updated._id?.toString(),
      name: updated.name,
      category: updated.category,
      price: updated.price,
      stock: updated.stock,
      isActive: updated.isActive,
    })
    res.status(200).json(ApiResponse.success(updated))
  }),

  deleteProduct: asyncHandler(async (req: Request, res: Response) => {
    const deleted = await productWriteRepo.delete(req.params.productId)
    if (!deleted) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND')
    await cacheService.invalidatePattern('products:list:')
    // Emit product.deleted event for real-time updates
    productEventEmitter.emit('product.deleted', {
      productId: req.params.productId,
    })
    res.status(200).json(ApiResponse.success({ deleted: true }))
  }),
}
