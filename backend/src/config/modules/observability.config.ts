import { env } from '../env'

export const observabilityConfig = {
  logLevel: env.LOG_LEVEL,
  /** pino-pretty only in development — JSON in production for log aggregators */
  prettyPrint: env.NODE_ENV === 'development',
  metricsEnabled: env.METRICS_ENABLED,
  metricsPort: 9090,
} as const
