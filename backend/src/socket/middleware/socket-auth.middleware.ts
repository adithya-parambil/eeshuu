import { Socket } from 'socket.io'
import { verifyAccessToken } from '../../utils/token-util'
import { blacklistService } from '../../utils/blacklist'
import { log } from '../../utils/logger'
import { MAX_SOCKET_CONNECTIONS } from '../../types/global.types'

// Per-userId connection counter (Map → Redis SCARD when scaling)
const connectionCounts = new Map<string, number>()

/**
 * socketAuthMiddleware — JWT verification on every Socket.io handshake.
 *
 * Token source: socket.handshake.auth.token ONLY (never query string — security).
 * Populates socket.data.userId and socket.data.role — set once, immutable.
 * Enforces MAX_SOCKET_CONNECTIONS (5) per userId.
 */
export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    // Token MUST come from handshake.auth — never from query string
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) {
      return next(new Error('NO_TOKEN'))
    }

    // Verify JWT signature and expiry
    const payload = verifyAccessToken(token) // throws AuthError if invalid

    // Check jti blacklist — covers logged-out tokens
    if (blacklistService.has(payload.jti)) {
      return next(new Error('TOKEN_REVOKED'))
    }

    // Enforce max concurrent connections per user
    const current = connectionCounts.get(payload.userId) ?? 0
    if (current >= MAX_SOCKET_CONNECTIONS) {
      return next(new Error('TOO_MANY_CONNECTIONS'))
    }

    // Attach user data — immutable after this point
    socket.data.userId = payload.userId
    socket.data.role = payload.role
    socket.data.jti = payload.jti

    // Track connection count; decrement on disconnect
    connectionCounts.set(payload.userId, current + 1)
    socket.on('disconnect', () => {
      const count = connectionCounts.get(payload.userId) ?? 1
      if (count <= 1) {
        connectionCounts.delete(payload.userId)
      } else {
        connectionCounts.set(payload.userId, count - 1)
      }
    })

    log.info({ userId: payload.userId, socketId: socket.id }, 'Socket authenticated')
    next()
  } catch {
    next(new Error('AUTH_FAILED'))
  }
}

/**
 * createSocketRateLimiter — per-userId event rate limiter.
 * windowMs / maxEvents: e.g. 1000ms / 50 events = 50 events/sec per user.
 */
export function createSocketRateLimiter(windowMs = 1_000, maxEvents = 50) {
  const userWindows = new Map<string, { count: number; resetAt: number }>()

  return (socket: Socket, next: (err?: Error) => void): void => {
    const userId = socket.data.userId as string | undefined
    if (!userId) return next()

    const now = Date.now()
    const window = userWindows.get(userId) ?? { count: 0, resetAt: now + windowMs }

    if (now > window.resetAt) {
      window.count = 1
      window.resetAt = now + windowMs
    } else {
      window.count++
    }

    if (window.count > maxEvents) {
      return next(new Error('RATE_LIMITED'))
    }

    userWindows.set(userId, window)
    next()
  }
}
