import { idempotencyStore } from '../utils/idempotency-store'
import type { IdempotencyPayload } from '../utils/idempotency-store'
import { redisConfig } from '../config/modules/redis.config'

/**
 * IdempotencyService — check and store idempotency keys.
 * Called only by use-cases — never by controllers or socket handlers directly.
 * The middleware also calls the store directly for HTTP-level idempotency.
 */
export class IdempotencyService {
  private readonly ttlSeconds = redisConfig.ttls.idempotency

  async check(key: string): Promise<IdempotencyPayload | null> {
    return idempotencyStore.get(key)
  }

  async store(key: string, payload: IdempotencyPayload): Promise<void> {
    return idempotencyStore.set(key, payload, this.ttlSeconds)
  }
}

export const idempotencyService = new IdempotencyService()
