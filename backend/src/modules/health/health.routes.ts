import { Router, Request, Response } from 'express'
import mongoose from 'mongoose'
import { redisConfig } from '../../config/modules/redis.config'

const router = Router()

/**
 * GET /health/live — liveness probe.
 * Always returns 200 if the process is running.
 * Never checks external dependencies — a slow DB must not kill the container.
 * Used by: Docker HEALTHCHECK, Kubernetes liveness probe.
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

/**
 * GET /health/ready — readiness probe.
 * Checks MongoDB (and Redis if configured).
 * Returns 200 if all checks pass, 503 if any fail.
 * Used by: load balancer to remove instance from rotation during degraded state.
 * Nginx: proxy_next_upstream error timeout http_503
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Array<{ name: string; status: 'pass' | 'fail'; latencyMs: number }> = []

  // MongoDB ping
  try {
    const start = Date.now()
    await mongoose.connection.db?.admin().ping()
    checks.push({ name: 'mongodb', status: 'pass', latencyMs: Date.now() - start })
  } catch {
    checks.push({ name: 'mongodb', status: 'fail', latencyMs: -1 })
  }

  // Redis ping — only if configured
  if (redisConfig.enabled) {
    try {
      const { default: Redis } = await import('ioredis')
      const client = new Redis(redisConfig.url!, { lazyConnect: true, connectTimeout: 2_000 })
      const start = Date.now()
      await client.ping()
      await client.quit()
      checks.push({ name: 'redis', status: 'pass', latencyMs: Date.now() - start })
    } catch {
      checks.push({ name: 'redis', status: 'fail', latencyMs: -1 })
    }
  }

  const allPass = checks.every((c) => c.status === 'pass')
  res.status(allPass ? 200 : 503).json({
    status: allPass ? 'ready' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  })
})

export default router
