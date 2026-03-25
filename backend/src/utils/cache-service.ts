// CacheService — generic key-value cache.
//
// Interface contract:
//   get<T>(key)                  — returns cached value or null
//   set(key, value, ttlSeconds)  — store a value with a TTL
//   del(key)                     — delete a single key
//   invalidatePattern(prefix)    — delete all keys starting with prefix
//
// Current implementation: in-memory Map (single-instance only)
// Future upgrade:         swap to ioredis — same interface, zero refactor
// Activation:             set REDIS_URL env var

interface CacheEntry<T> {
  value: T
  expiresAt: number // epoch ms
}

class CacheService {
  // Using Map<string, CacheEntry<unknown>> and casting on retrieval
  private readonly store = new Map<string, CacheEntry<unknown>>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    } as CacheEntry<unknown>)
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }

  async invalidatePattern(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
      }
    }
  }
}

// Singleton — one cache per process
export const cacheService = new CacheService()
