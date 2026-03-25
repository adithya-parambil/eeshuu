import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { requestContext } from '../utils/logger'

/**
 * requestId middleware — assigns a UUID v4 to every request.
 * Stores it in AsyncLocalStorage so all subsequent log calls in that request's
 * async chain automatically include it — no manual passing required.
 * Also sets X-Request-ID response header for client-side correlation.
 *
 * MUST be first in the middleware chain (before pino-http).
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  req.id = uuidv4()
  res.setHeader('X-Request-ID', req.id)
  // Run the rest of the request inside the AsyncLocalStorage context
  requestContext.run({ requestId: req.id }, next)
}
