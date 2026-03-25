// IdempotencyStore — persists idempotency keys and their associated responses.
//
// Interface contract:
//   get(key)                         — retrieve a stored response or null
//   set(key, payload, ttlSeconds)    — persist the response payload
//
// Current implementation: delegates to IdempotencyKeyModel (MongoDB with TTL index)
// Future upgrade:         swap to Redis — same interface, zero refactor
// MongoDB TTL index on expiresAt auto-removes expired docs.

export interface IdempotencyPayload {
  response: unknown
  statusCode: number
}

class IdempotencyStore {
  // Lazy import to avoid circular deps at module load time
  private get model() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../repositories/models/idempotency.model').IdempotencyKeyModel
  }

  async get(key: string): Promise<IdempotencyPayload | null> {
    const doc = await this.model.findOne({ key: { $eq: key } }).lean()
    if (!doc) return null
    return { response: doc.response as unknown, statusCode: doc.statusCode as number }
  }

  async set(key: string, payload: IdempotencyPayload, ttlSeconds: number): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
    await this.model.findOneAndUpdate(
      { key: { $eq: key } },
      { $setOnInsert: { key, response: payload.response, statusCode: payload.statusCode, expiresAt } },
      { upsert: true },
    )
  }
}

// Singleton
export const idempotencyStore = new IdempotencyStore()
