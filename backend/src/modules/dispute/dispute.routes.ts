import { Router } from 'express'
import { disputeController } from './dispute.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { roleGuard } from '../../middleware/role.guard'

const router = Router()
router.use(authMiddleware)

// Any authenticated user can raise a dispute
router.post('/', disputeController.raise)

// Get disputes for the current user (customer/delivery) or all (admin)
router.get('/', disputeController.list)

// Admin: respond to / resolve a dispute
router.put('/:disputeId', roleGuard(['admin']), disputeController.respond)

export default router
