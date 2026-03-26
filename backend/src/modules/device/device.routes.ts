import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { saveToken, removeToken } from './device.controller'

const router = Router()

// All device routes require authentication
router.use(authMiddleware)

// POST /api/v1/device/token - Save device token
router.post('/token', saveToken)

// DELETE /api/v1/device/token - Remove device token
router.delete('/token', removeToken)

export default router
