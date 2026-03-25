import { Router } from 'express'
import { userController } from './user.controller'
import { authMiddleware } from '../../middleware/auth.middleware'
import { validateBody } from '../../middleware/validate.middleware'
import { z } from 'zod'

const router = Router()

router.use(authMiddleware)

const UpdateProfileDto = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
})

router.get('/me', userController.getProfile)
router.patch('/me', validateBody(UpdateProfileDto), userController.updateProfile)

export default router
