import { UserRole } from './global.types'

declare global {
  namespace Express {
    interface Request {
      /** UUID v4 assigned by requestIdMiddleware */
      id: string
      /** Populated by authMiddleware after JWT verification */
      user?: {
        userId: string
        role: UserRole
        jti: string
      }
      /** Idempotency-Key header value, set by idempotency middleware */
      idempotencyKey?: string
    }
  }
}

export {}
