import { env } from '../env'

export const dbConfig = {
  uri: env.DB_URI,
  retryAttempts: env.DB_RETRY_ATTEMPTS,
  retryDelayMs: env.DB_RETRY_DELAY_MS,
  // readUri: env.DB_READ_URI — future: point read repositories at a MongoDB read replica
  // To activate: add DB_READ_URI to env.ts schema, pass to read repository constructors
  options: {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  },
} as const
