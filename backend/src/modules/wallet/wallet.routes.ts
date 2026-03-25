import { Router } from 'express'
import { walletController } from './wallet.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { roleGuard } from '../../middleware/role.guard'

const router = Router()
router.use(authMiddleware)

// Both delivery and admin can check balance
router.get('/balance', roleGuard(['delivery', 'admin']), walletController.getBalance)
// Delivery only
router.post('/withdraw', roleGuard(['delivery']), walletController.withdraw)
router.get('/transactions', roleGuard(['delivery']), walletController.getTransactions)

export default router
