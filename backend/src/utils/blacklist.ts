// BlacklistService — jti-based token blacklist.
//
// Interface contract:
//   add(jti, ttlMs)   — mark a jti as revoked for the given duration
//   has(jti)          — returns true if jti is currently blacklisted
//   purgeExpired()    — remove entries whose TTL has passed
//
// Current implementation: in-memory Map (single-instance only)
// Future upgrade:         swap to Redis SET with TTL — same interface, zero refactor

interface BlacklistEntry {
  expiresAt: number // epoch ms
}

class BlacklistService {
  private readonly store = new Map<string, BlacklistEntry>()
  private purgeTimer: ReturnType<typeof setInterval> | null = null

  /** Start the background purge job (call once at startup) */
  startPurgeJob(intervalMs = 5 * 60 * 1000): void {
    if (this.purgeTimer !== null) return
    this.purgeTimer = setInterval(() => this.purgeExpired(), intervalMs)
    // Allow Node to exit even if this timer is active
    if (this.purgeTimer.unref) this.purgeTimer.unref()
  }

  add(jti: string, ttlMs: number): void {
    this.store.set(jti, { expiresAt: Date.now() + ttlMs })
  }

  has(jti: string): boolean {
    const entry = this.store.get(jti)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.store.delete(jti)
      return false
    }
    return true
  }

  purgeExpired(): void {
    const now = Date.now()
    for (const [jti, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(jti)
      }
    }
  }
}

// Singleton — one blacklist per process
export const blacklistService = new BlacklistService()
