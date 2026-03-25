import { z } from 'zod'

const EnvSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DB_URI: z.string().min(1, 'DB_URI is required'),
  DB_FALLBACK_URI: z.string().optional(),
  DB_RETRY_ATTEMPTS: z.string().default('5').transform(Number),
  DB_RETRY_DELAY_MS: z.string().default('3000').transform(Number),
  JWT_ACCESS_SECRET: z
    .string()
    .min(64, 'JWT_ACCESS_SECRET must be at least 64 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(64, 'JWT_REFRESH_SECRET must be at least 64 characters'),
  JWT_ACCESS_TTL_SECONDS: z
    .string()
    .default('900')
    .transform(Number),
  JWT_REFRESH_TTL_SECONDS: z
    .string()
    .default('604800')
    .transform(Number),
  BCRYPT_ROUNDS: z
    .string()
    .default('12')
    .transform(Number)
    .refine((n) => n >= 10, 'BCRYPT_ROUNDS must be at least 10'),
  CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL'),
  REDIS_URL: z.string().optional(),
  REDIS_KEY_PREFIX: z.string().default('qc:'),
  RATE_LIMIT_AUTH_MAX: z.string().default('10').transform(Number),
  RATE_LIMIT_AUTH_WINDOW: z.string().default('900000').transform(Number),
  RATE_LIMIT_GENERAL_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_GENERAL_WINDOW: z.string().default('60000').transform(Number),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug'])
    .default('info'),
  METRICS_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  RAZORPAY_KEY_ID: z.string().default('rzp_test_placeholder'),
  RAZORPAY_KEY_SECRET: z.string().default('placeholder_secret'),
})

export type Env = z.infer<typeof EnvSchema>

// Fail fast — if any required var is missing or malformed the server must not start
export const env: Env = (() => {
  const result = EnvSchema.safeParse(process.env)
  if (!result.success) {
    console.error('FATAL: Invalid environment configuration')
    console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2))
    process.exit(1)
  }
  return result.data
})()
