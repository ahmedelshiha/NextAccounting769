/**
 * usePerformanceMonitoring
 * 
 * Custom hook for monitoring component and operation performance
 * Tracks key metrics and provides real-time performance data
 */

import { useEffect, useRef, useCallback } from 'react'
import { performanceMetrics, getPerformanceReport } from '@/lib/performance/metrics'

interface PerformanceConfig {
  enabled?: boolean
  logToConsole?: boolean
  trackComponentRender?: boolean
  trackFilterApply?: boolean
  trackBulkAction?: boolean
}

export function usePerformanceMonitoring(
  componentName: string,
  config: PerformanceConfig = {}
) {
  const {
    enabled = true,
    logToConsole = process.env.NODE_ENV === 'development',
    trackComponentRender = true,
    trackFilterApply = true,
    trackBulkAction = true
  } = config

  const renderStartTimeRef = useRef<number>(0)
  const isTrackedRef = useRef(false)

  // Track initial render time
  useEffect(() => {
    if (!enabled || !trackComponentRender) return

    renderStartTimeRef.current = performance.now()

    return () => {
      const renderTime = performance.now() - renderStartTimeRef.current
      performanceMetrics.endMeasure(`${componentName}-render`, {
        renderTime: Math.round(renderTime * 100) / 100
      })

      if (logToConsole && renderTime > 100) {
        console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
      }
    }
  }, [componentName, enabled, trackComponentRender, logToConsole])

  // Callback to track filter application
  const trackFilterApplication = useCallback(
    (filterType: string, itemsFiltered: number) => {
      if (!enabled || !trackFilterApply) return

      performanceMetrics.startMeasure(`filter-apply-${filterType}`)
      
      return () => {
        const metric = performanceMetrics.endMeasure(`filter-apply-${filterType}`, {
          itemsFiltered
        })

        if (logToConsole && metric && metric.duration > 300) {
          console.warn(
            `⚠️ Slow filter in ${componentName}: ${metric.duration.toFixed(2)}ms (${itemsFiltered} items)`
          )
        }
      }
    },
    [enabled, trackFilterApply, componentName, logToConsole]
  )

  // Callback to track bulk action execution
  const trackBulkActionExecution = useCallback(
    (actionType: string, itemCount: number) => {
      if (!enabled || !trackBulkAction) return

      performanceMetrics.startMeasure(`bulk-action-${actionType}`)

      return () => {
        const metric = performanceMetrics.endMeasure(`bulk-action-${actionType}`, {
          itemCount
        })

        if (logToConsole && metric && metric.duration > 1000) {
          console.warn(
            `⚠️ Slow bulk action in ${componentName}: ${metric.duration.toFixed(2)}ms (${itemCount} items)`
          )
        }
      }
    },
    [enabled, trackBulkAction, componentName, logToConsole]
  )

  // Callback to get current performance stats
  const getPerformanceStats = useCallback(() => {
    if (!enabled) return null
    return getPerformanceReport()
  }, [enabled])

  // Callback to log all metrics
  const logMetrics = useCallback(() => {
    if (!enabled) return
    performanceMetrics.logAll()
  }, [enabled])

  return {
    trackFilterApplication,
    trackBulkActionExecution,
    getPerformanceStats,
    logMetrics,
    enabled
  }
}

/**
 * useRenderCount
 * 
 * Simple hook to track how many times a component renders
 * Useful for debugging unnecessary re-renders
 */
export function useRenderCount(componentName: string) {
  const renderCountRef = useRef(0)

  useEffect(() => {
    renderCountRef.current++
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${componentName}] rendered ${renderCountRef.current} times`)
    }
  })

  return renderCountRef.current
}

/**
 * useDebouncedEffect
 * 
 * Hook that debounces effect execution
 * Useful for expensive operations like filtering
 */
export function useDebouncedEffect(
  effect: () => void | (() => void),
  dependencies: React.DependencyList,
  delay: number = 300
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      effect()
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, dependencies)
}

/**
 * useComponentMemory
 *
 * Hook to monitor component memory usage in development
 */
export function useComponentMemory(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    // Check if performance.memory is available (non-standard API)
    const perf = performance as any
    if (!perf.memory) return

    const memUsage = perf.memory
    console.debug(`[${componentName}] Memory - Used: ${(memUsage.usedJSHeapSize / 1048576).toFixed(2)}MB, Limit: ${(memUsage.jsHeapSizeLimit / 1048576).toFixed(2)}MB`)
  }, [componentName])
}
