import { Router } from 'express'
import { productController } from './product.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { roleGuard } from '../../middleware/role.guard'
import { validateBody, validateQuery } from '../../middleware/validate.middleware'
import { ProductFiltersDto } from '../../use-cases/product/list-products.use-case'
import { CreateProductDto } from '../../use-cases/product/create-product.use-case'

const router = Router()

// GET /api/v1/products — public product listing
router.get('/', validateQuery(ProductFiltersDto), productController.listProducts)

// GET /api/v1/products/:productId — public product detail
router.get('/:productId', productController.getProduct)

// POST /api/v1/products — admin only
router.post(
  '/',
  authMiddleware,
  roleGuard(['admin']),
  validateBody(CreateProductDto),
  productController.createProduct,
)

// PUT /api/v1/products/:productId — admin only
router.put(
  '/:productId',
  authMiddleware,
  roleGuard(['admin']),
  productController.updateProduct,
)

// DELETE /api/v1/products/:productId — admin only
router.delete(
  '/:productId',
  authMiddleware,
  roleGuard(['admin']),
  productController.deleteProduct,
)

export default router
