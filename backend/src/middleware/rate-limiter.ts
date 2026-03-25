import rateLimit from 'express-rate-limit'
import { rateLimitConfig } from '../config/modules/rate-limit.config'
import { ApiResponse } from '../utils/response-builder'

// Shared handler — structured JSON instead of the default HTML response
const handler = (
  _req: unknown,
  res: { status: (n: number) => { json: (b: unknown) => void } },
): void => {
  res.status(429).json(
    ApiResponse.error('Too many requests — please try again later', 'RATE_LIMIT_EXCEEDED'),
  )
}

/**
 * authRateLimiter — 10 req / 15 min per IP
 * Applied to: POST /auth/register, POST /auth/login
 */
export const authRateLimiter = rateLimit({
  windowMs: rateLimitConfig.auth.windowMs,
  max: rateLimitConfig.auth.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
})

/**
 * orderRateLimiter — 20 req / min per authenticated userId
 * Applied to: POST /orders (order placement)
 */
export const orderRateLimiter = rateLimit({
  windowMs: rateLimitConfig.order.windowMs,
  max: rateLimitConfig.order.max,
  keyGenerator: (req) => (req.user?.userId ?? req.ip ?? 'anon'),
  standardHeaders: true,
  legacyHeaders: false,
  handler,
})

/**
 * generalRateLimiter — 100 req / min per IP
 * Applied globally to all API routes via app.ts
 */
export const generalRateLimiter = rateLimit({
  windowMs: rateLimitConfig.general.windowMs,
  max: rateLimitConfig.general.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
})
