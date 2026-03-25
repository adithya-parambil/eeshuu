import { createClient } from 'redis'
import { env } from '../config/env'
import { log } from './logger'

/**
 * locationCache — thin Redis wrapper for real-time partner GPS.
 *
 * Design (per the article):
 *   - GPS pings NEVER write to MongoDB. They overwrite a single Redis key.
 *   - Key: location:order:{orderId}
 *   - Value: JSON { lat, lng, accuracy?, updatedAt }
 *   - TTL: 2 hours (auto-expires if order goes stale / partner disconnects)
 *   - On DELIVERED: caller writes final location to MongoDB once, then deletes key.
 *
 * Falls back gracefully if Redis is unavailable (location just won't be cached).
 */

export interface CachedLocation {
  lat: number
  lng: number
  accuracy?: number
  updatedAt: string
}

const KEY_PREFIX = 'location:order:'
const TTL_SECONDS = 7200 // 2 hours

let client: ReturnType<typeof createClient> | null = null
let connected = false

async function getClient(): Promise<ReturnType<typeof createClient> | null> {
  if (!env.REDIS_URL) return null
  if (client && connected) return client

  try {
    client = createClient({ url: env.REDIS_URL })
    client.on('error', (err) => {
      log.warn({ err }, 'Redis location-cache error')
      connected = false
    })
    client.on('ready', () => { connected = true })
    await client.connect()
    connected = true
    return client
  } catch (err) {
    log.warn({ err }, 'Redis location-cache: failed to connect, falling back to no-cache')
    client = null
    return null
  }
}

/** Overwrite the current location for an order (no history, just latest). */
export async function setOrderLocation(
  orderId: string,
  location: Omit<CachedLocation, 'updatedAt'>,
): Promise<void> {
  const c = await getClient()
  if (!c) return
  try {
    await c.set(
      `${KEY_PREFIX}${orderId}`,
      JSON.stringify({ ...location, updatedAt: new Date().toISOString() }),
      { EX: TTL_SECONDS },
    )
  } catch (err) {
    log.warn({ err, orderId }, 'locationCache.set failed')
  }
}

/** Get the latest cached location for an order (used when customer opens order page). */
export async function getOrderLocation(orderId: string): Promise<CachedLocation | null> {
  const c = await getClient()
  if (!c) return null
  try {
    const raw = await c.get(`${KEY_PREFIX}${orderId}`)
    return raw ? (JSON.parse(raw) as CachedLocation) : null
  } catch {
    return null
  }
}

/** Delete the key when order is delivered or cancelled. */
export async function deleteOrderLocation(orderId: string): Promise<void> {
  const c = await getClient()
  if (!c) return
  try {
    await c.del(`${KEY_PREFIX}${orderId}`)
  } catch { /* ignore */ }
}
