import { env } from '../env'

export const corsConfig = {
  origin: env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'Idempotency-Key',
  ],
  credentials: true,
} as const
