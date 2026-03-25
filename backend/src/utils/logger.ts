import pino from 'pino'
import { AsyncLocalStorage } from 'async_hooks'
import { observabilityConfig } from '../config/modules/observability.config'

// ─── AsyncLocalStorage request context ────────────────────────────────────────
// requestId (and optionally userId) flow automatically through the async chain
// without needing to pass them as parameters everywhere.
export interface RequestContext {
  requestId: string
  userId?: string
}

export const requestContext = new AsyncLocalStorage<RequestContext>()

// ─── Pino instance ────────────────────────────────────────────────────────────
export const logger = pino({
  level: observabilityConfig.logLevel,
  // Redact sensitive fields from all log output
  redact: [
    'req.headers.authorization',
    'body.password',
    'body.refreshToken',
    'password',
    'refreshToken',
    'passwordHash',
    'refreshTokenHash',
  ],
  transport: observabilityConfig.prettyPrint
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
})

// ─── Bound log helpers ────────────────────────────────────────────────────────
// Always merge the current AsyncLocalStorage context so every log line carries
// { requestId, userId? } without manual plumbing.
export const log = {
  info(data: object, msg: string): void {
    logger.info({ ...requestContext.getStore(), ...data }, msg)
  },
  warn(data: object, msg: string): void {
    logger.warn({ ...requestContext.getStore(), ...data }, msg)
  },
  error(data: object, msg: string): void {
    logger.error({ ...requestContext.getStore(), ...data }, msg)
  },
  debug(data: object, msg: string): void {
    logger.debug({ ...requestContext.getStore(), ...data }, msg)
  },
}
