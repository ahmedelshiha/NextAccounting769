/**
 * Performance Monitoring for Filter Bar Operations
 * Tracks query times, identifies slow queries, and logs performance metrics
 */

export interface PerformanceMetric {
  operation: string
  duration: number // milliseconds
  timestamp: number
  status: 'success' | 'error' | 'timeout'
  metadata?: Record<string, any>
}

export interface PerformanceStats {
  operation: string
  count: number
  totalDuration: number
  avgDuration: number
  minDuration: number
  maxDuration: number
  slowCount: number // Count of operations exceeding threshold
  errorCount: number
  successRate: number // Percentage of successful operations
}

export interface PerformanceThresholds {
  slow?: number // Milliseconds before marking as slow (default: 1000)
  timeout?: number // Milliseconds before timeout (default: 5000)
  errorAlert?: number // Count threshold for alerting (default: 5)
}

/**
 * Performance monitor for tracking operation metrics
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private thresholds: Required<PerformanceThresholds>
  private maxMetrics: number
  private startMarkers = new Map<string, number>()

  constructor(thresholds: PerformanceThresholds = {}, maxMetrics = 1000) {
    this.thresholds = {
      slow: thresholds.slow ?? 1000,
      timeout: thresholds.timeout ?? 5000,
      errorAlert: thresholds.errorAlert ?? 5
    }
    this.maxMetrics = maxMetrics
  }

  /**
   * Start timing an operation
   */
  startTimer(operationId: string): void {
    this.startMarkers.set(operationId, performance.now())
  }

  /**
   * End timing and record metric
   */
  endTimer(
    operationId: string,
    operation: string,
    status: 'success' | 'error' | 'timeout' = 'success',
    metadata?: Record<string, any>
  ): number {
    const startTime = this.startMarkers.get(operationId)
    
    if (!startTime) {
      console.warn(`No start marker for operation: ${operationId}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.startMarkers.delete(operationId)

    this.recordMetric({
      operation,
      duration,
      timestamp: Date.now(),
      status,
      metadata
    })

    return duration
  }

  /**
   * Record a metric manually
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // Keep metrics size manageable
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log slow operations
    if (metric.duration > this.thresholds.slow && metric.status === 'success') {
      console.warn(
        `Slow operation detected: ${metric.operation} took ${metric.duration.toFixed(2)}ms`,
        metric.metadata
      )
    }

    // Log errors
    if (metric.status === 'error') {
      console.error(
        `Operation failed: ${metric.operation}`,
        metric.metadata
      )
    }
  }

  /**
   * Get statistics for an operation
   */
  getStats(operation: string): PerformanceStats | null {
    const operationMetrics = this.metrics.filter(m => m.operation === operation)
    
    if (operationMetrics.length === 0) {
      return null
    }

    const durations = operationMetrics.map(m => m.duration)
    const totalDuration = durations.reduce((a, b) => a + b, 0)
    const avgDuration = totalDuration / durations.length
    const minDuration = Math.min(...durations)
    const maxDuration = Math.max(...durations)
    const slowCount = operationMetrics.filter(m => m.duration > this.thresholds.slow).length
    const errorCount = operationMetrics.filter(m => m.status === 'error').length
    const successCount = operationMetrics.filter(m => m.status === 'success').length
    const successRate = (successCount / operationMetrics.length) * 100

    return {
      operation,
      count: operationMetrics.length,
      totalDuration,
      avgDuration,
      minDuration,
      maxDuration,
      slowCount,
      errorCount,
      successRate
    }
  }

  /**
   * Get statistics for all operations
   */
  getAllStats(): PerformanceStats[] {
    const operations = new Set(this.metrics.map(m => m.operation))
    return Array.from(operations)
      .map(op => this.getStats(op))
      .filter((stats): stats is PerformanceStats => stats !== null)
      .sort((a, b) => b.avgDuration - a.avgDuration)
  }

  /**
   * Get slow operations (exceeding threshold)
   */
  getSlowOperations(limit = 10): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.duration > this.thresholds.slow && m.status === 'success')
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  /**
   * Get recent operations
   */
  getRecent(count = 20): PerformanceMetric[] {
    return this.metrics.slice(-count)
  }

  /**
   * Get operations by status
   */
  getByStatus(status: 'success' | 'error' | 'timeout'): PerformanceMetric[] {
    return this.metrics.filter(m => m.status === status)
  }

  /**
   * Get metrics time range
   */
  getTimeRange(startTime: number, endTime: number): PerformanceMetric[] {
    return this.metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime)
  }

  /**
   * Generate performance report
   */
  getReport(operation?: string): string {
    const stats = operation 
      ? [this.getStats(operation)].filter((s): s is PerformanceStats => s !== null)
      : this.getAllStats()

    if (stats.length === 0) {
      return 'No metrics recorded'
    }

    let report = 'Performance Report:\n'
    report += '==================\n\n'

    for (const stat of stats) {
      report += `Operation: ${stat.operation}\n`
      report += `  Count: ${stat.count}\n`
      report += `  Avg Duration: ${stat.avgDuration.toFixed(2)}ms\n`
      report += `  Min Duration: ${stat.minDuration.toFixed(2)}ms\n`
      report += `  Max Duration: ${stat.maxDuration.toFixed(2)}ms\n`
      report += `  Slow Operations: ${stat.slowCount} (${((stat.slowCount / stat.count) * 100).toFixed(1)}%)\n`
      report += `  Success Rate: ${stat.successRate.toFixed(1)}%\n`
      report += '\n'
    }

    return report
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.startMarkers.clear()
  }

  /**
   * Get metric count
   */
  getMetricCount(): number {
    return this.metrics.length
  }

  /**
   * Check for performance alerts
   */
  checkAlerts(): {
    slowOperations: PerformanceStats[]
    highErrorRate: PerformanceStats[]
  } {
    const allStats = this.getAllStats()

    return {
      slowOperations: allStats.filter(s => s.slowCount > this.thresholds.errorAlert),
      highErrorRate: allStats.filter(s => s.errorCount > this.thresholds.errorAlert)
    }
  }
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new PerformanceMonitor({
  slow: 500, // Flag operations slower than 500ms
  timeout: 10000,
  errorAlert: 3
})

/**
 * Higher-order function to monitor async operations
 */
export async function monitorAsync<T>(
  operationName: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const opId = `${operationName}:${Date.now()}:${Math.random()}`
  globalPerformanceMonitor.startTimer(opId)

  try {
    const result = await fn()
    globalPerformanceMonitor.endTimer(opId, operationName, 'success', metadata)
    return result
  } catch (error) {
    globalPerformanceMonitor.endTimer(opId, operationName, 'error', {
      ...metadata,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

/**
 * Higher-order function to monitor sync operations
 */
export function monitorSync<T>(
  operationName: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  const opId = `${operationName}:${Date.now()}:${Math.random()}`
  globalPerformanceMonitor.startTimer(opId)

  try {
    const result = fn()
    globalPerformanceMonitor.endTimer(opId, operationName, 'success', metadata)
    return result
  } catch (error) {
    globalPerformanceMonitor.endTimer(opId, operationName, 'error', {
      ...metadata,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

/**
 * Database query performance analyzer
 */
export class QueryPerformanceAnalyzer {
  private metrics: PerformanceMetric[] = []

  recordQuery(
    query: string,
    duration: number,
    rowsAffected?: number,
    error?: string
  ): void {
    this.metrics.push({
      operation: `query:${query.substring(0, 50)}...`,
      duration,
      timestamp: Date.now(),
      status: error ? 'error' : 'success',
      metadata: { rowsAffected, error }
    })
  }

  /**
   * Find slow queries
   */
  getSlowQueries(threshold = 1000, limit = 10): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  /**
   * Get query statistics
   */
  getStats(): {
    totalQueries: number
    avgDuration: number
    maxDuration: number
    slowQueryCount: number
    errorCount: number
  } {
    if (this.metrics.length === 0) {
      return {
        totalQueries: 0,
        avgDuration: 0,
        maxDuration: 0,
        slowQueryCount: 0,
        errorCount: 0
      }
    }

    const durations = this.metrics.map(m => m.duration)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    const maxDuration = Math.max(...durations)
    const slowQueryCount = this.metrics.filter(m => m.duration > 1000).length
    const errorCount = this.metrics.filter(m => m.status === 'error').length

    return {
      totalQueries: this.metrics.length,
      avgDuration,
      maxDuration,
      slowQueryCount,
      errorCount
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
  }
}

/**
 * Global query analyzer instance
 */
export const queryAnalyzer = new QueryPerformanceAnalyzer()
