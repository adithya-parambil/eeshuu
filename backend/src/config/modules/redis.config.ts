import { env } from '../env'

export const redisConfig = {
  url: env.REDIS_URL,
  prefix: env.REDIS_KEY_PREFIX,
  enabled: !!env.REDIS_URL,
  ttls: {
    /** Seconds — cached read results */
    cache: 300,
    /** Seconds — jti blacklist lives slightly longer than the access token */
    blacklist: env.JWT_ACCESS_TTL_SECONDS + 60,
    /** Seconds — idempotency keys last 24 hours */
    idempotency: 86400,
    /** Seconds — rate-limit window */
    rateLimit: Math.ceil(env.RATE_LIMIT_GENERAL_WINDOW / 1000),
  },
} as const
