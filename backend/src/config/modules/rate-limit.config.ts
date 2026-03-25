import { env } from '../env'

export const rateLimitConfig = {
  auth: {
    max: env.RATE_LIMIT_AUTH_MAX,
    windowMs: env.RATE_LIMIT_AUTH_WINDOW,
  },
  order: {
    max: 20,
    windowMs: 60_000, // 1 minute — per authenticated userId
  },
  general: {
    max: env.RATE_LIMIT_GENERAL_MAX,
    windowMs: env.RATE_LIMIT_GENERAL_WINDOW,
  },
} as const
