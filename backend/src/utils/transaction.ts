import mongoose from 'mongoose'

type WithSession<T> = (session: mongoose.ClientSession | undefined) => Promise<T>

/**
 * withTransaction — transaction-ready wrapper.
 *
 * Today: passes undefined session (each operation auto-manages its own session).
 * Future: uncomment the session block. All use-cases that call withTransaction
 * will automatically participate in ACID transactions — zero business-logic changes.
 */
export async function withTransaction<T>(fn: WithSession<T>): Promise<T> {
  // ── Current: no explicit session ──────────────────────────────────────────
  return fn(undefined)

  // ── FUTURE: enable when multi-collection writes need ACID guarantees ──────
  // const session = await mongoose.startSession()
  // try {
  //   return await session.withTransaction(() => fn(session))
  // } finally {
  //   session.endSession()
  // }
}
