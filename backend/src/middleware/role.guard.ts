import { Request, Response, NextFunction } from 'express'
import { ForbiddenError } from '../utils/app-error'
import type { UserRole } from '../types/global.types'

/**
 * roleGuard — RBAC middleware factory.
 * Returns a middleware that allows the request only if req.user.role is in
 * the allowed list. Must be chained after authMiddleware.
 *
 * Usage: router.get('/orders', authMiddleware, roleGuard(['customer', 'admin']), handler)
 */
export function roleGuard(allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user
    if (!user) {
      return next(new ForbiddenError('Authentication required', 'AUTH_REQUIRED'))
    }
    if (!allowedRoles.includes(user.role)) {
      return next(
        new ForbiddenError(
          `Role '${user.role}' is not authorized for this resource`,
          'FORBIDDEN',
        ),
      )
    }
    next()
  }
}
