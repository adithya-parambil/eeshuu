export const socketConfig = {
  /** ms before a ping is considered timed out */
  pingTimeout: 20_000,
  /** ms between pings */
  pingInterval: 25_000,
  /** max payload size in bytes (1 MB) */
  maxHttpBufferSize: 1e6,
  connectionStateRecovery: {
    /** 2 minutes — allow short reconnects without losing room membership */
    maxDisconnectionDuration: 2 * 60 * 1000,
    /** re-run auth middleware on state recovery */
    skipMiddlewares: false,
  },
} as const
