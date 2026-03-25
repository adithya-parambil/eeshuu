import { Server as SocketIOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'
import { log } from '../../utils/logger'
import { redisConfig } from '../../config/modules/redis.config'

/**
 * setupRedisAdapter — wires @socket.io/redis-adapter for horizontal scaling.
 *
 * Why this matters:
 *   Instance A hosts Customer C1 (room: order:abc)
 *   Instance B hosts Delivery D1 — D1 accepts order on Instance B
 *   Without Redis: io.to('order:abc').emit(...) only reaches sockets on Instance B
 *   With Redis:    emit is published to Redis channel, all instances subscribe,
 *                  Instance A receives it and delivers to C1's socket
 *
 * All broadcastToRoom calls are unchanged — the adapter is transparent.
 * Activation: set REDIS_URL env var. Zero business logic changes.
 */
export async function setupRedisAdapter(io: SocketIOServer): Promise<void> {
  // Non-null assertion safe: caller checks redisConfig.enabled before calling
  const url = redisConfig.url!
  const keyPrefix = `${redisConfig.prefix}sock:`

  const pub = new Redis(url, { keyPrefix, lazyConnect: true })
  const sub = new Redis(url, { keyPrefix, lazyConnect: true })

  pub.on('error', (err) => log.error({ err }, 'Socket Redis pub error'))
  sub.on('error', (err) => log.error({ err }, 'Socket Redis sub error'))

  await Promise.all([pub.connect(), sub.connect()])

  io.adapter(createAdapter(pub, sub))
  log.info({}, 'Socket.io: Redis adapter active (multi-instance ready)')
}
