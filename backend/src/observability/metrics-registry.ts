/**
 * Central metrics registry.
 * All metric names and their label sets are declared here so they can be
 * imported by any module without creating ad-hoc string literals.
 *
 * Usage:
 *   import { METRICS } from '../observability/metrics-registry'
 *   metrics.increment(METRICS.ORDER_PLACED, { role: 'customer' })
 */

export const METRICS = {
  // ── HTTP ──────────────────────────────────────────────────────────────
  /** Total HTTP requests received */
  HTTP_REQUESTS_TOTAL: 'http_requests_total',
  /** HTTP request duration in milliseconds */
  HTTP_REQUEST_DURATION_MS: 'http_request_duration_ms',

  // ── Auth ──────────────────────────────────────────────────────────────
  /** Successful login events */
  AUTH_LOGIN_TOTAL: 'auth_login_total',
  /** Successful registration events */
  AUTH_REGISTER_TOTAL: 'auth_register_total',
  /** Token refresh events */
  AUTH_REFRESH_TOTAL: 'auth_refresh_total',
  /** Token reuse / replay attack detections */
  AUTH_TOKEN_REUSE_TOTAL: 'auth_token_reuse_total',

  // ── Orders ────────────────────────────────────────────────────────────
  /** Orders placed by customers */
  ORDER_PLACED_TOTAL: 'order_placed_total',
  /** Orders cancelled (by customer or admin) */
  ORDER_CANCELLED_TOTAL: 'order_cancelled_total',
  /** Orders accepted by a delivery partner */
  ORDER_ACCEPTED_TOTAL: 'order_accepted_total',
  /** Order status update events */
  ORDER_STATUS_UPDATED_TOTAL: 'order_status_updated_total',

  // ── Socket ────────────────────────────────────────────────────────────
  /** Socket events emitted — label: { event, result } */
  SOCKET_EVENTS_TOTAL: 'socket_events_total',
  /** Active socket connections — label: { namespace } */
  SOCKET_CONNECTIONS_ACTIVE: 'socket_connections_active',
  /** Duplicate socket events dropped by dedup filter */
  SOCKET_DEDUP_DROPPED_TOTAL: 'socket_dedup_dropped_total',

  // ── Cache ─────────────────────────────────────────────────────────────
  /** Cache hits — label: { store } */
  CACHE_HIT_TOTAL: 'cache_hit_total',
  /** Cache misses — label: { store } */
  CACHE_MISS_TOTAL: 'cache_miss_total',

  // ── Database ──────────────────────────────────────────────────────────
  /** MongoDB operation duration in milliseconds — label: { op, collection } */
  DB_OPERATION_DURATION_MS: 'db_operation_duration_ms',
  /** MongoDB operation errors — label: { op, collection } */
  DB_OPERATION_ERRORS_TOTAL: 'db_operation_errors_total',

  // ── Idempotency ───────────────────────────────────────────────────────
  /** Idempotency cache hits (duplicate request replayed) */
  IDEMPOTENCY_HIT_TOTAL: 'idempotency_hit_total',
} as const

export type MetricName = (typeof METRICS)[keyof typeof METRICS]
