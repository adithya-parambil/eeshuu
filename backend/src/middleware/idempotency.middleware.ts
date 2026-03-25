import { Request, Response, NextFunction } from 'express'
import { idempotencyStore } from '../utils/idempotency-store'
import { log } from '../utils/logger'
import { metrics } from '../utils/metrics'

/**
 * idempotent — HTTP idempotency middleware factory.
 *
 * How it works:
 *   1. Reads the Idempotency-Key header from the request
 *   2. If no key: passes through normally (key is optional)
 *   3. If key found in store: returns cached response with X-Idempotent: true
 *   4. If key not found: intercepts res.json() to capture and store the response,
 *      then sets X-Idempotent: false on the first response
 *
 * Apply to: POST /api/v1/orders, POST /api/v1/auth/register
 * Do NOT apply to: login, refresh, status updates (not safe to cache)
 *
 * TTL defaults to 24 hours (86400 seconds).
 */
export function idempotent(ttlSeconds = 86_400) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.headers['idempotency-key'] as string | undefined
    if (!key) return next()

    req.idempotencyKey = key

    // Replay: return the cached response without re-executing the use-case
    try {
      const stored = await idempotencyStore.get(key)
      if (stored) {
        metrics.increment('idempotency_hits_total', { route: req.path })
        res.setHeader('X-Idempotent', 'true')
        res.status(stored.statusCode).json(stored.response)
        return
      }
    } catch (err) {
      log.error({ err }, 'Idempotency store read failed — proceeding without cache')
    }

    // First call: intercept res.json to capture the response for future replays
    const originalJson = res.json.bind(res)
    res.json = (body: unknown) => {
      // Only cache successful (non-5xx) responses
      if (res.statusCode < 500) {
        idempotencyStore
          .set(key, { response: body, statusCode: res.statusCode }, ttlSeconds)
          .catch((err: unknown) => log.error({ err }, 'Failed to store idempotency response'))
      }
      res.setHeader('X-Idempotent', 'false')
      return originalJson(body)
    }

    next()
  }
}

/** Named alias used by some route files */
export const idempotencyMiddleware = idempotent()
