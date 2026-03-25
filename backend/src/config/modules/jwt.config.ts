import { env } from '../env'

export const jwtConfig = {
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessTtlSeconds: env.JWT_ACCESS_TTL_SECONDS,
  refreshTtlSeconds: env.JWT_REFRESH_TTL_SECONDS,
} as const
