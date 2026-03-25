import { Router } from 'express'
import { adminController } from './admin.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { roleGuard } from '../../middleware/role.guard'

const router = Router()

router.use(authMiddleware)
router.use(roleGuard(['admin'] as const))

router.get('/stats', adminController.getSystemStats)
router.get('/orders', adminController.listAllOrders)
router.get('/users', adminController.listAllUsers)
router.get('/disputes', adminController.listDisputes)

export default router
