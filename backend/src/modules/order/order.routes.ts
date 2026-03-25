import { Router } from 'express'
import { orderController } from './order.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { roleGuard } from '../../middleware/role.guard'
import { validateBody, validateQuery } from '../../middleware/validate.middleware'
import { idempotent } from '../../middleware/idempotency.middleware'
import { orderRateLimiter } from '../../middleware/rate-limiter'
import { PlaceOrderDto } from '../../use-cases/order/place-order.use-case'
import { UpdateStatusDto } from '../../use-cases/order/update-order-status.use-case'
import { z } from 'zod'

const router = Router()

// All order routes require authentication
router.use(authMiddleware)

const OrderQueryDto = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
})

// ── Delivery routes (MUST be before /:orderId to avoid Express matching "available" as ID) ──

// GET /api/v1/orders/available — list PENDING unassigned orders for delivery partners
router.get(
  '/available',
  roleGuard(['delivery']),
  orderController.listAvailable,
)

// GET /api/v1/orders/my-active — delivery partner's currently active order
router.get(
  '/my-active',
  roleGuard(['delivery']),
  orderController.getMyActive,
)

// GET /api/v1/orders/my-earnings — delivery partner earnings stats
router.get(
  '/my-earnings',
  roleGuard(['delivery']),
  orderController.getMyEarnings,
)

// GET /api/v1/orders/my-history — delivery partner past orders
router.get(
  '/my-history',
  roleGuard(['delivery']),
  orderController.getMyHistory,
)

// ── Customer routes ────────────────────────────────────────────────────────

// POST /api/v1/orders — place a new order
router.post(
  '/',
  roleGuard(['customer']),
  orderRateLimiter,
  idempotent(86_400),
  validateBody(PlaceOrderDto),
  orderController.placeOrder,
)

// GET /api/v1/orders — list customer's own orders
router.get(
  '/',
  roleGuard(['customer', 'admin']),
  validateQuery(OrderQueryDto),
  orderController.listOrders,
)

// GET /api/v1/orders/:orderId — get a single order
router.get(
  '/:orderId',
  roleGuard(['customer', 'delivery', 'admin']),
  orderController.getOrder,
)

// GET /api/v1/orders/:orderId/location — latest partner location from Redis (no DB)
router.get(
  '/:orderId/location',
  roleGuard(['customer', 'delivery', 'admin']),
  orderController.getPartnerLocation,
)

// DELETE /api/v1/orders/:orderId — cancel an order (customer or admin)
router.delete(
  '/:orderId',
  roleGuard(['customer', 'admin']),
  orderController.cancelOrder,
)

// POST /api/v1/orders/:orderId/accept — atomic order claim
router.post(
  '/:orderId/accept',
  roleGuard(['delivery']),
  orderController.acceptOrder,
)

// PUT /api/v1/orders/:orderId/status — update delivery status
router.put(
  '/:orderId/status',
  roleGuard(['delivery', 'admin']),
  validateBody(UpdateStatusDto.omit({ orderId: true })),
  orderController.updateStatus,
)

export default router
