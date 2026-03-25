import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/token-util'
import { blacklistService } from '../utils/blacklist'
import { AuthError } from '../utils/app-error'
import type { UserRole } from '../types/global.types'

/**
 * authMiddleware — validates the JWT from the Authorization header.
 *
 * 1. Extracts Bearer token from Authorization header
 * 2. Verifies JWT signature and expiry
 * 3. Checks jti against the blacklist (covers logout + reuse detection)
 * 4. Populates req.user = { userId, role, jti }
 *
 * Throws AuthError (→ 401) on any failure. Never leaks internals.
 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AuthError('Missing or malformed Authorization header', 'TOKEN_MISSING'))
  }

  const token = authHeader.slice(7) // strip 'Bearer '
  const payload = verifyAccessToken(token) // throws AuthError if invalid

  // Check jti blacklist — covers logged-out tokens and revoked sessions
  if (blacklistService.has(payload.jti)) {
    return next(new AuthError('Token has been revoked', 'TOKEN_REVOKED'))
  }

  req.user = {
    userId: payload.userId,
    role: payload.role as UserRole,
    jti: payload.jti,
  }

  next()
}

/** Named alias — some route files import as `authenticate` */
export const authenticate = authMiddleware
