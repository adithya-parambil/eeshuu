import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { log } from '../utils/logger'
import { corsConfig } from '../config/modules/cors.config'
import { socketConfig } from '../config/modules/socket.config'
import { socketAuthMiddleware, createSocketRateLimiter } from './middleware/socket-auth.middleware'
import { setupRedisAdapter } from './adapters/redis.adapter'
import { setupOrderNamespace } from './namespaces/order.namespace'
import { setupWalletNamespace } from './namespaces/wallet.namespace'
import { setupNotificationsNamespace } from './namespaces/notifications.namespace'
import { setupAdminNamespace } from './namespaces/admin.namespace'
import { redisConfig } from '../config/modules/redis.config'

/**
 * initializeSocketEngine — attaches Socket.io to the HTTP server.
 * Called once from server.ts after the HTTP server is created.
 */
export async function initializeSocketEngine(server: HTTPServer): Promise<SocketIOServer> {
  const io = new SocketIOServer(server, {
    cors: {
      origin: corsConfig.origin,
      credentials: corsConfig.credentials,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: socketConfig.pingTimeout,
    pingInterval: socketConfig.pingInterval,
    maxHttpBufferSize: socketConfig.maxHttpBufferSize,
    connectionStateRecovery: socketConfig.connectionStateRecovery,
    allowEIO3: false,
  })

  // ── Global middleware (runs on every namespace) ────────────────────────
  io.use(socketAuthMiddleware)
  io.use(createSocketRateLimiter(1_000, 50)) // 50 events/sec per user

  // ── Redis adapter for horizontal scaling (no-op if REDIS_URL not set) ──
  if (redisConfig.enabled) {
    try {
      await setupRedisAdapter(io)
    } catch (err) {
      log.warn({ err }, 'Redis adapter setup failed — running in single-instance mode')
    }
  } else {
    log.info({}, 'Socket.io: in-memory adapter (single-instance mode)')
  }

  // ── Namespaces ─────────────────────────────────────────────────────────
  setupOrderNamespace(io)
  setupWalletNamespace(io)
  setupNotificationsNamespace(io)
  setupAdminNamespace(io)

  // ── Default namespace connection logging ───────────────────────────────
  io.on('connection', (socket) => {
    log.info({ socketId: socket.id, userId: socket.data.userId }, 'Socket connected')
    socket.on('disconnect', (reason) => {
      log.info({ socketId: socket.id, userId: socket.data.userId, reason }, 'Socket disconnected')
    })
    socket.on('error', (err) => {
      log.error({ err, socketId: socket.id }, 'Socket error')
    })
  })

  log.info({}, 'Socket.io engine initialized')
  return io
}
