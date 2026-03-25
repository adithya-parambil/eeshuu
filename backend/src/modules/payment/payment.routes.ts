import { Router } from 'express'
import { paymentController } from './payment.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { roleGuard } from '../../middleware/role.guard'

const router = Router()
router.use(authMiddleware)
router.use(roleGuard(['customer']))

router.post('/create-order', paymentController.createOrder)
router.post('/verify', paymentController.verify)

export default router
