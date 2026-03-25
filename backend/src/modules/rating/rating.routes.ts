import { Router } from 'express'
import { ratingController } from './rating.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { roleGuard } from '../../middleware/role.guard'

const router = Router()
router.use(authMiddleware)

// Customer submits a rating after delivery
router.post('/', roleGuard(['customer']), ratingController.submit)

// Get ratings for a delivery partner (public-ish, used by delivery dashboard)
router.get('/partner/:partnerId', ratingController.getForPartner)

// Get rating for a specific order
router.get('/order/:orderId', ratingController.getForOrder)

export default router
