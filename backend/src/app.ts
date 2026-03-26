import express, { Express } from 'express'
import { createServer } from 'http'
import { Server as HTTPServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import { corsConfig } from './config/modules/cors.config'
import { requestIdMiddleware } from './middleware/request-id'
import { generalRateLimiter } from './middleware/rate-limiter'
import { errorHandler, notFoundHandler } from './middleware/error-handler'
import { logger } from './utils/logger'
import { metrics } from './utils/metrics'

// Routes
import authRoutes from './modules/auth/auth.routes'
import userRoutes from './modules/user/user.routes'
import orderRoutes from './modules/order/order.routes'
import productRoutes from './modules/product/product.routes'
import adminRoutes from './modules/admin/admin.routes'
import healthRoutes from './modules/health/health.routes'
import ratingRoutes from './modules/rating/rating.routes'
import disputeRoutes from './modules/dispute/dispute.routes'
import walletRoutes from './modules/wallet/wallet.routes'
import paymentRoutes from './modules/payment/payment.routes'

export function createApp(): { app: Express; server: HTTPServer } {
  const app = express()

  // ── Trust reverse proxy (sets req.ip from X-Forwarded-For) ─────────────────
  app.set('trust proxy', 1)

  // ── 1. requestId — must be first so all subsequent logs carry it ──────────
  app.use(requestIdMiddleware)

  // ── 2. Security headers ───────────────────────────────────────────────────
  app.use(helmet())

  // ── 3. CORS — whitelist CLIENT_URL only ───────────────────────────────────
  app.use(cors(corsConfig))
  app.options('*', cors(corsConfig))

  // ── 4. Request logger (pino-http) ─────────────────────────────────────────
  app.use(pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error'
      if (res.statusCode >= 400) return 'warn'
      return 'info'
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, _res, err) => `${req.method} ${req.url} — ${err.message}`,
    autoLogging: true,
    serializers: {
      req: (req) => ({ method: req.method, url: req.url, id: req.id }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }))

  // ── 5. Metrics middleware — http_requests_total + http_duration_ms ─────────
  app.use((req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
      metrics.increment('http_requests_total', {
        method: req.method,
        route: req.route?.path ?? req.path,
        status: String(res.statusCode),
      })
      metrics.histogram('http_duration_ms', {
        method: req.method,
        route: req.route?.path ?? req.path,
      }, Date.now() - start)
    })
    next()
  })

  // ── 6. Body parser — 10 kb limit prevents payload bombs ──────────────────
  app.use(express.json({ limit: '10kb' }))
  app.use(express.urlencoded({ limit: '10kb', extended: false }))

  // ── 7. Global rate limiter (100 req/min per IP) ───────────────────────────
  app.use(generalRateLimiter)

  // ── 8. Routes ─────────────────────────────────────────────────────────────
  app.use('/health', healthRoutes)
  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/users', userRoutes)
  app.use('/api/v1/orders', orderRoutes)
  app.use('/api/v1/products', productRoutes)
  app.use('/api/v1/admin', adminRoutes)
  app.use('/api/v1/ratings', ratingRoutes)
  app.use('/api/v1/disputes', disputeRoutes)
  app.use('/api/v1/wallet', walletRoutes)
  app.use('/api/v1/payment', paymentRoutes)

  // ── 9. 404 fallback ───────────────────────────────────────────────────────
  app.use(notFoundHandler)

  // ── 10. Centralized error handler — must be last ──────────────────────────
  app.use(errorHandler)

  const server = createServer(app)
  return { app, server }
}
