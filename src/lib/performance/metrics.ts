/**
 * Performance Metrics Collection and Analysis
 * 
 * Tracks key performance indicators for the admin users dashboard:
 * - Page load time
 * - Component render time
 * - Data fetch time
 * - Filter application time
 * - Bulk action execution time
 */

export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceMetricsCollector {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private marks: Map<string, number> = new Map()
  private enabled: boolean = typeof window !== 'undefined'

  /**
   * Start measuring a performance metric
   */
  startMeasure(name: string): void {
    if (!this.enabled) return
    this.marks.set(name, performance.now())
  }

  /**
   * End measuring and record the metric
   */
  endMeasure(name: string, metadata?: Record<string, any>): PerformanceMetric | null {
    if (!this.enabled) return null

    const startTime = this.marks.get(name)
    if (!startTime) {
      console.warn(`No start mark found for "${name}"`)
      return null
    }

    const duration = performance.now() - startTime
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata
    }

    this.marks.delete(name)

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(metric)

    return metric
  }

  /**
   * Measure a synchronous operation
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.startMeasure(name)
    try {
      return fn()
    } finally {
      this.endMeasure(name, metadata)
    }
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.startMeasure(name)
    try {
      return await fn()
    } finally {
      this.endMeasure(name, metadata)
    }
  }

  /**
   * Get all metrics for a specific operation
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || []
  }

  /**
   * Get statistics for a metric
   */
  getStats(name: string) {
    const metrics = this.getMetrics(name)
    if (metrics.length === 0) {
      return null
    }

    const durations = metrics.map(m => m.duration)
    const sum = durations.reduce((a, b) => a + b, 0)
    const avg = sum / durations.length
    const min = Math.min(...durations)
    const max = Math.max(...durations)

    return {
      count: metrics.length,
      avg,
      min,
      max,
      sum,
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99)
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted.sort((a, b) => a - b)[index]
  }

  /**
   * Get all collected metrics
   */
  getAllMetrics(): Record<string, PerformanceMetric[]> {
    return Object.fromEntries(this.metrics)
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
    this.marks.clear()
  }

  /**
   * Log all metrics to console
   */
  logAll(): void {
    console.group('📊 Performance Metrics Report')

    for (const [name, metrics] of this.metrics.entries()) {
      const stats = this.getStats(name)
      if (stats) {
        console.log(`\n${name}:`)
        console.table({
          Count: stats.count,
          'Avg (ms)': stats.avg.toFixed(2),
          'Min (ms)': stats.min.toFixed(2),
          'Max (ms)': stats.max.toFixed(2),
          'P50 (ms)': stats.p50.toFixed(2),
          'P95 (ms)': stats.p95.toFixed(2),
          'P99 (ms)': stats.p99.toFixed(2)
        })
      }
    }

    console.groupEnd()
  }
}

// Singleton instance
export const performanceMetrics = new PerformanceMetricsCollector()

/**
 * Get performance report for dashboard
 */
export function getPerformanceReport() {
  return {
    pageLoad: performanceMetrics.getStats('page-load'),
    componentRender: performanceMetrics.getStats('component-render'),
    dataFetch: performanceMetrics.getStats('data-fetch'),
    filterApply: performanceMetrics.getStats('filter-apply'),
    bulkAction: performanceMetrics.getStats('bulk-action'),
    totalMetrics: Object.keys(performanceMetrics.getAllMetrics()).length
  }
}

/**
 * Export metrics as JSON for analysis
 */
export function exportMetricsAsJSON() {
  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      metrics: performanceMetrics.getAllMetrics(),
      stats: {
        pageLoad: performanceMetrics.getStats('page-load'),
        componentRender: performanceMetrics.getStats('component-render'),
        dataFetch: performanceMetrics.getStats('data-fetch'),
        filterApply: performanceMetrics.getStats('filter-apply'),
        bulkAction: performanceMetrics.getStats('bulk-action')
      }
    },
    null,
    2
  )
}
