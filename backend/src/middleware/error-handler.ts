import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/app-error'
import { ApiResponse } from '../utils/response-builder'
import { log } from '../utils/logger'
import { env } from '../config/env'

/**
 * Centralized error handler — must be the LAST middleware registered in app.ts.
 * Converts AppError subclasses to structured JSON responses.
 * Never leaks stack traces in production.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Check instanceof OR duck-type (handles tsx/module-boundary edge cases)
  const appErr = err instanceof AppError
    ? err
    : ('statusCode' in err && 'code' in err ? err as unknown as AppError : null)

  if (appErr) {
    const statusCode = (appErr as AppError).statusCode
    const code = (appErr as AppError).code
    const errors = (appErr as AppError).errors
    if (statusCode >= 500) {
      log.error({ err, code }, err.message)
    } else {
      log.warn({ code }, err.message)
    }
    res.status(statusCode).json(ApiResponse.error(err.message, code, errors))
    return
  }

  // Unknown / unhandled error
  log.error({ err }, 'Unhandled error')

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : (err.message ?? 'An unexpected error occurred')

  res.status(500).json(ApiResponse.error(message, 'INTERNAL_SERVER_ERROR'))
}

/**
 * notFoundHandler — 404 fallback for all unmatched routes.
 * Registered just before the error handler.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(ApiResponse.error('Route not found', 'NOT_FOUND'))
}
