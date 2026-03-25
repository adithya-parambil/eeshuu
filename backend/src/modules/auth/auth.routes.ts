import { Router } from 'express'
import { authController } from './auth.controller'
import { validateBody } from '../../middleware/validate.middleware'
import { authRateLimiter } from '../../middleware/rate-limiter'
import { idempotent } from '../../middleware/idempotency.middleware'
import { authMiddleware } from '../../middleware/auth.middleware'
import { RegisterDto } from '../../use-cases/auth/register.use-case'
import { LoginDto } from '../../use-cases/auth/login.use-case'
import { RefreshDto } from '../../use-cases/auth/refresh.use-case'

const router = Router()

// POST /api/v1/auth/register
// Idempotent: duplicate registrations with same key return cached response
router.post(
  '/register',
  authRateLimiter,
  idempotent(86_400),
  validateBody(RegisterDto),
  authController.register,
)

// POST /api/v1/auth/login
router.post(
  '/login',
  authRateLimiter,
  validateBody(LoginDto),
  authController.login,
)

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  validateBody(RefreshDto),
  authController.refresh,
)

// POST /api/v1/auth/logout — requires valid access token
router.post(
  '/logout',
  authMiddleware,
  authController.logout,
)

export default router
