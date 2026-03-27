import { Router } from 'express'
import { cartController } from './cart.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { roleGuard } from '../../middleware/role.guard'
import { validateBody } from '../../middleware/validate.middleware'
import { UpdateCartDto } from '../../use-cases/cart/update-cart.use-case'

const router = Router()

// GET /api/v1/cart — customer only
router.get(
  '/',
  authMiddleware,
  roleGuard(['customer']),
  cartController.getCart,
)

// PUT /api/v1/cart — customer only (sync whole cart)
router.put(
  '/',
  authMiddleware,
  roleGuard(['customer']),
  validateBody(UpdateCartDto),
  cartController.updateCart,
)

export default router
