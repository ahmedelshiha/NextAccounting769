/**
 * Performance Analytics System
 *
 * Tracks and measures:
 * - Page load performance
 * - Component render times
 * - API response times
 * - Virtual scrolling effectiveness
 * - Server-side filtering improvements
 * - User interaction metrics
 */

export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: number
  context: {
    page?: string
    component?: string
    action?: string
    userId?: string
    tenantId?: string
    [key: string]: any
  }
}

export interface PageLoadMetrics {
  navigationStart: number
  domContentLoaded: number
  loadComplete: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  timeToInteractive: number
}

export interface APIMetrics {
  endpoint: string
  method: string
  status: number
  duration: number
  responseSize: number
  cached: boolean
  timestamp: number
}

export interface VirtualScrollingMetrics {
  component: string
  totalItems: number
  visibleItems: number
  fps: number
  memoryUsage: number
  renderTime: number
  isVirtualized: boolean
}

/**
 * Performance Analytics Collector
 */
export class PerformanceAnalyticsCollector {
  private metrics: PerformanceMetric[] = []
  private apiMetrics: APIMetrics[] = []
  private virtualScrollMetrics: VirtualScrollingMetrics[] = []
  private isEnabled = typeof window !== 'undefined'

  constructor(private batchSize: number = 50, private flushInterval: number = 30_000) {
    if (this.isEnabled) {
      this.setupPageLoadMetrics()
      this.setupPeriodicFlush()
    }
  }

  /**
   * Collect Web Vitals from browser API
   */
  private setupPageLoadMetrics(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      // CLS (Cumulative Layout Shift)
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'CLS',
            value: (entry as any).value,
            unit: 'score',
            context: { type: 'web-vital' }
          })
        }
      })

      clsObserver.observe({ type: 'layout-shift', buffered: true })

      // FCP and LCP
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name === 'first-contentful-paint' ? 'FCP' : 'LCP',
            value: entry.startTime,
            unit: 'ms',
            context: { type: 'web-vital' }
          })
        }
      })

      paintObserver.observe({ type: 'paint', buffered: true })
      paintObserver.observe({ type: 'largest-contentful-paint', buffered: true })

      // Navigation timing
      window.addEventListener('load', () => {
        const perfData = window.performance.timing
        this.recordMetric({
          name: 'PageLoadTime',
          value: perfData.loadEventEnd - perfData.navigationStart,
          unit: 'ms',
          context: { type: 'navigation' }
        })
      })
    } catch (error) {
      console.error('Failed to setup performance metrics:', error)
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): string {
    const id = this.generateId()
    const fullMetric: PerformanceMetric = {
      id,
      timestamp: Date.now(),
      ...metric
    }

    this.metrics.push(fullMetric)

    // Flush if batch size reached
    if (this.metrics.length >= this.batchSize) {
      this.flush()
    }

    return id
  }

  /**
   * Record API call metrics
   */
  recordAPIMetric(metric: Omit<APIMetrics, 'timestamp'>): void {
    this.apiMetrics.push({
      ...metric,
      timestamp: Date.now()
    })

    if (this.apiMetrics.length >= this.batchSize) {
      this.flushAPIMetrics()
    }
  }

  /**
   * Record virtual scrolling performance
   */
  recordVirtualScrollMetric(metric: VirtualScrollingMetrics): void {
    this.virtualScrollMetrics.push(metric)

    // Analyze effectiveness
    const improvement = metric.isVirtualized
      ? Math.round((1 - metric.visibleItems / metric.totalItems) * 100)
      : 0

    this.recordMetric({
      name: 'VirtualScrollingEffectiveness',
      value: improvement,
      unit: 'percent',
      context: {
        component: metric.component,
        totalItems: metric.totalItems,
        fps: metric.fps
      }
    })
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get API metrics
   */
  getAPIMetrics(): APIMetrics[] {
    return [...this.apiMetrics]
  }

  /**
   * Calculate metrics summary
   */
  getSummary() {
    const summary = {
      totalMetrics: this.metrics.length,
      apiCalls: this.apiMetrics.length,
      avgResponseTime: this.calculateAverageResponseTime(),
      p95ResponseTime: this.calculatePercentileResponseTime(95),
      p99ResponseTime: this.calculatePercentileResponseTime(99),
      cacheHitRate: this.calculateCacheHitRate(),
      virtualScrollingInstances: this.virtualScrollMetrics.length,
      avgVirtualScrollingImprovement: this.calculateAvgVirtualScrollingImprovement()
    }

    return summary
  }

  /**
   * Flush metrics to backend
   */
  async flush(): Promise<void> {
    if (this.metrics.length === 0) return

    try {
      const metricsToSend = [...this.metrics]
      this.metrics = []

      await fetch('/api/admin/perf-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: metricsToSend,
          timestamp: Date.now()
        })
      })
    } catch (error) {
      console.error('Failed to flush metrics:', error)
      // Re-add metrics if flush failed
      // this.metrics.unshift(...metricsToSend)
    }
  }

  /**
   * Flush API metrics
   */
  private async flushAPIMetrics(): Promise<void> {
    if (this.apiMetrics.length === 0) return

    try {
      const metricsToSend = [...this.apiMetrics]
      this.apiMetrics = []

      await fetch('/api/admin/perf-metrics/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: metricsToSend,
          timestamp: Date.now()
        })
      })
    } catch (error) {
      console.error('Failed to flush API metrics:', error)
    }
  }

  /**
   * Setup periodic flush
   */
  private setupPeriodicFlush(): void {
    setInterval(() => {
      this.flush()
      this.flushAPIMetrics()
    }, this.flushInterval)
  }

  /**
   * Helper: calculate average response time
   */
  private calculateAverageResponseTime(): number {
    if (this.apiMetrics.length === 0) return 0
    const sum = this.apiMetrics.reduce((acc, m) => acc + m.duration, 0)
    return Math.round(sum / this.apiMetrics.length)
  }

  /**
   * Helper: calculate percentile response time
   */
  private calculatePercentileResponseTime(percentile: number): number {
    if (this.apiMetrics.length === 0) return 0
    const sorted = [...this.apiMetrics].sort((a, b) => a.duration - b.duration)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index]?.duration || 0
  }

  /**
   * Helper: calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    if (this.apiMetrics.length === 0) return 0
    const cacheHits = this.apiMetrics.filter(m => m.cached).length
    return Math.round((cacheHits / this.apiMetrics.length) * 100)
  }

  /**
   * Helper: calculate average virtual scrolling improvement
   */
  private calculateAvgVirtualScrollingImprovement(): number {
    if (this.virtualScrollMetrics.length === 0) return 0
    const improvements = this.virtualScrollMetrics
      .filter(m => m.isVirtualized)
      .map(m => (1 - m.visibleItems / m.totalItems) * 100)
    return improvements.length > 0
      ? Math.round(improvements.reduce((a, b) => a + b, 0) / improvements.length)
      : 0
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Global analytics instance
 */
export const analyticsCollector =
  typeof window !== 'undefined' ? new PerformanceAnalyticsCollector() : null

/**
 * Hook for recording metrics in React components
 */
export function usePerformanceMetrics() {
  const recordMetric = (name: string, value: number, unit: string = 'ms', context: any = {}) => {
    if (analyticsCollector) {
      analyticsCollector.recordMetric({ name, value, unit, context })
    }
  }

  const recordAPIMetric = (endpoint: string, method: string, status: number, duration: number, cached: boolean = false) => {
    if (analyticsCollector) {
      analyticsCollector.recordAPIMetric({
        endpoint,
        method,
        status,
        duration,
        responseSize: 0, // Will be set by interceptor
        cached
      })
    }
  }

  return { recordMetric, recordAPIMetric }
}
