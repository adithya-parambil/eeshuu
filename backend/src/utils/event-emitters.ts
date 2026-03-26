import { EventEmitter } from 'events'
import Redis from 'ioredis'
import { log } from './logger'
import { env } from '../config/env'

/**
 * DistributedEventEmitter — extends EventEmitter with Redis Pub/Sub for
 * cross-node communication in a clustered environment.
 */
class DistributedEventEmitter extends EventEmitter {
    private pubClient?: Redis
    private subClient?: Redis
    private readonly channel: string

    constructor(channel: string) {
        super()
        this.channel = channel

        if (env.REDIS_URL) {
            try {
                this.pubClient = new Redis(env.REDIS_URL)
                this.subClient = new Redis(env.REDIS_URL)

                this.subClient.subscribe(this.channel, (err) => {
                    if (err) log.error({ err, channel: this.channel }, 'Failed to subscribe to events channel')
                })

                this.subClient.on('message', (ch, message) => {
                    if (ch === this.channel) {
                        try {
                            const { event, payload } = JSON.parse(message)
                            super.emit(event, payload)
                        } catch (err) {
                            log.error({ err, message, channel: this.channel }, 'Redis event parse error')
                        }
                    }
                })
                log.info({ channel: this.channel }, 'DistributedEventEmitter initialized via Redis Pub/Sub')
            } catch (err) {
                log.error({ err, channel: this.channel }, 'Redis init failed, using local EventEmitter')
            }
        } else {
            log.info({ channel: this.channel }, 'REDIS_URL not set, using local EventEmitter')
        }
    }

    /**
     * Override emit: if Redis is active, route via Pub/Sub so all nodes receive it.
     * The subscriber will call super.emit() to trigger local listeners.
     */
    override emit(event: string | symbol, ...args: any[]): boolean {
        if (this.pubClient && typeof event === 'string') {
            const payload = args[0]
            this.pubClient.publish(this.channel, JSON.stringify({ event, payload })).catch((err) => {
                log.error({ err, event, channel: this.channel }, 'Failed to publish event to Redis')
            })
            // We don't call super.emit() here because the subClient will receive its own message
            // and trigger super.emit() avoiding double execution.
            return true
        }
        return super.emit(event, ...args)
    }
}

// ─── Event Emitters for different domains ───────────────────────────────────────

/**
 * Order events - broadcasts order lifecycle events (placed, accepted, status updates, cancelled)
 */
export const orderEventEmitter = new DistributedEventEmitter('order:events')

/**
 * Wallet events - broadcasts wallet balance changes
 */
export const walletEventEmitter = new DistributedEventEmitter('wallet:events')

/**
 * Product events - broadcasts product CRUD events (created, updated, deleted)
 */
export const productEventEmitter = new DistributedEventEmitter('product:events')
