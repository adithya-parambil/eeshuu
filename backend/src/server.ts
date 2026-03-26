import { createApp } from './app'
import { env } from './config/env'
import { log } from './utils/logger'
import { blacklistService } from './utils/blacklist'
import mongoose from 'mongoose'
import { dbConfig } from './config/modules/db.config'
import { initializeSocketEngine } from './socket/socket.engine'

// Handle unhandled promise rejections - DON'T exit
process.on('unhandledRejection', (reason: any, promise) => {
  console.error('[UNHANDLED REJECTION] reason:', reason)
  console.error('[UNHANDLED REJECTION] stack:', reason?.stack || 'No stack trace')
  log.error({ 
    reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason,
    promise 
  }, 'Unhandled Rejection - SERVER WILL NOT CRASH')
  // IMPORTANT: Don't call process.exit() - just log it
})

// Handle uncaught exceptions - DON'T exit  
process.on('uncaughtException', (error: any) => {
  console.error('[UNCAUGHT EXCEPTION] error:', error)
  console.error('[UNCAUGHT EXCEPTION] stack:', error?.stack || 'No stack trace')
  log.error({ 
    error: error instanceof Error ? { message: error.message, stack: error.stack } : error 
  }, 'Uncaught Exception - SERVER WILL NOT CRASH')
  // IMPORTANT: Don't call process.exit() - just log it
})

// Prevent Node.js from crashing on async errors
process.on('warning', (warning) => {
  console.warn('[PROCESS WARNING]', warning)
  log.warn({ warning }, 'Process warning')
})

async function connectWithRetry(
  uri: string,
  attempts: number,
  delayMs: number,
): Promise<void> {
  for (let i = 1; i <= attempts; i++) {
    try {
      await mongoose.connect(uri, dbConfig.options)
      log.info({}, 'MongoDB connected')
      return
    } catch (err) {
      log.warn({ attempt: i, maxAttempts: attempts }, 'MongoDB connection failed')
      if (i === attempts) throw err
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
}

async function bootstrap(): Promise<void> {
  try {
    // Connect to MongoDB with retry, fall back to Atlas URI if primary fails
    try {
      await connectWithRetry(dbConfig.uri, dbConfig.retryAttempts, dbConfig.retryDelayMs)
    } catch (primaryErr) {
      const fallbackUri = env.DB_FALLBACK_URI
      if (fallbackUri) {
        log.warn({}, 'Primary MongoDB unreachable — falling back to Atlas URI')
        await mongoose.connect(fallbackUri, dbConfig.options)
        log.info({}, 'MongoDB connected via fallback Atlas URI')
      } else {
        throw primaryErr
      }
    }

    // Start background purge job for jti blacklist
    blacklistService.startPurgeJob()

    // Create Express app + HTTP server
    const { server } = createApp()

    // Attach Socket.io (Phase 3 handlers wired here)
    await initializeSocketEngine(server)

    const port = Number(env.PORT)
    const host = '0.0.0.0'

    server.listen(port, host, () => {
      log.info({ port, env: env.NODE_ENV }, 'Server started')
    })

    // ── Graceful shutdown ──────────────────────────────────────────────────
    const shutdown = async (signal: string): Promise<void> => {
      log.info({ signal }, 'Shutdown signal received')

      server.close(async () => {
        log.info({}, 'HTTP server closed')
        try {
          await mongoose.disconnect()
          log.info({}, 'MongoDB disconnected')
        } catch (err) {
          log.error({ err }, 'Error disconnecting MongoDB')
        }
        process.exit(0)
      })

      // Force-kill after 30 s if graceful close hangs
      setTimeout(() => {
        log.error({}, 'Forced shutdown after timeout')
        process.exit(1)
      }, 30_000).unref()
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  } catch (error) {
    log.error({ err: error }, 'Fatal error during bootstrap')
    process.exit(1)
  }
}

bootstrap()
