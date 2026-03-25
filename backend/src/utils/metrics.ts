// MetricsCollector — observability stubs.
//
// All methods are no-ops in the current implementation.
// Future upgrade: swap to prom-client (Prometheus). Same interface — zero refactor.
// Activation: set METRICS_ENABLED=true and implement using prom-client.

type Labels = Record<string, string>

class MetricsCollector {
  /**
   * Increment a counter metric.
   * Examples:
   *   metrics.increment('http_requests_total', { method: 'POST', route: '/orders', status: '201' })
   *   metrics.increment('order_placed_total', { role: 'customer' })
   *   metrics.increment('socket_events_total', { event: 'ORDER_ACCEPT', result: 'success' })
   *   metrics.increment('idempotency_hits_total', { route: '/orders' })
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  increment(_counter: string, _labels?: Labels): void {
    // no-op — replace with prom-client Counter.inc() when ready
  }

  /**
   * Record a histogram observation.
   * Examples:
   *   metrics.histogram('http_duration_ms', { route: '/orders' }, 45)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  histogram(_name: string, _labels: Labels, _value: number): void {
    // no-op — replace with prom-client Histogram.observe() when ready
  }
}

// Singleton
export const metrics = new MetricsCollector()
