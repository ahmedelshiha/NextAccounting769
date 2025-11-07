import { useCallback, useMemo, useRef, useEffect } from 'react'

export interface VirtualScrollMetrics {
  itemCount: number
  visibleCount: number
  scrollPosition: number
  fps: number
  renderTime: number
}

export interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
  minItemsToVirtualize?: number
  onMetricsChange?: (metrics: VirtualScrollMetrics) => void
}

/**
 * Hook for managing virtual scrolling with performance tracking
 *
 * Provides utilities to:
 * - Calculate visible range
 * - Track FPS during scrolling
 * - Measure render performance
 * - Emit metrics for analytics
 */
export function useVirtualizedScroll({
  itemHeight,
  containerHeight,
  overscan = 10,
  minItemsToVirtualize = 100,
  onMetricsChange
}: VirtualScrollOptions) {
  const metricsRef = useRef<VirtualScrollMetrics>({
    itemCount: 0,
    visibleCount: Math.ceil(containerHeight / itemHeight) + overscan * 2,
    scrollPosition: 0,
    fps: 60,
    renderTime: 0
  })

  const fpsRef = useRef<number[]>([])
  const renderStartRef = useRef<number>(0)
  const lastMetricsEmitRef = useRef<number>(0)

  // Calculate visible range based on scroll position
  const calculateVisibleRange = useCallback(
    (scrollTop: number, totalItems: number) => {
      const visibleCount = Math.ceil(containerHeight / itemHeight)
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
      const endIndex = Math.min(totalItems, startIndex + visibleCount + overscan * 2)

      return {
        startIndex,
        endIndex,
        visibleCount: endIndex - startIndex
      }
    },
    [itemHeight, containerHeight, overscan]
  )

  // Track FPS during scrolling
  const trackFPS = useCallback(() => {
    const now = performance.now()
    fpsRef.current.push(now)

    // Keep only last 60 measurements (1 second at 60fps)
    if (fpsRef.current.length > 60) {
      fpsRef.current.shift()
    }

    // Calculate FPS from delta times
    if (fpsRef.current.length > 2) {
      const deltas = []
      for (let i = 1; i < fpsRef.current.length; i++) {
        deltas.push(fpsRef.current[i] - fpsRef.current[i - 1])
      }
      const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length
      metricsRef.current.fps = Math.round(1000 / avgDelta)
    }
  }, [])

  // Emit metrics periodically
  const emitMetrics = useCallback(
    (totalItems: number, scrollPosition: number) => {
      const now = performance.now()

      // Emit metrics every 500ms
      if (now - lastMetricsEmitRef.current > 500 && onMetricsChange) {
        metricsRef.current.itemCount = totalItems
        metricsRef.current.scrollPosition = scrollPosition
        metricsRef.current.renderTime = performance.now() - renderStartRef.current

        onMetricsChange(metricsRef.current)
        lastMetricsEmitRef.current = now
      }
    },
    [onMetricsChange]
  )

  const handleScroll = useCallback(
    (scrollTop: number, totalItems: number) => {
      renderStartRef.current = performance.now()
      trackFPS()
      emitMetrics(totalItems, scrollTop)
    },
    [trackFPS, emitMetrics]
  )

  return {
    calculateVisibleRange,
    handleScroll,
    trackFPS,
    shouldVirtualize: (itemCount: number) => itemCount >= minItemsToVirtualize,
    getMetrics: () => metricsRef.current
  }
}

/**
 * Hook for managing virtualized list state with deduplication
 */
export function useVirtualizedListState<T extends { id?: string | number }>(items: T[]) {
  return useMemo(() => {
    // Deduplicate items by id
    const seen = new Set<string | number>()
    const deduplicated = items.filter(item => {
      const id = item.id ?? Math.random()
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    return {
      items: deduplicated,
      itemCount: deduplicated.length,
      isDuplicated: deduplicated.length !== items.length,
      duplicateCount: items.length - deduplicated.length
    }
  }, [items])
}

/**
 * Hook to detect if virtual scrolling would be beneficial
 */
export function useVirtualizationBenefit(itemCount: number, estimatedItemHeight: number = 72) {
  return useMemo(() => {
    const virtualizeThreshold = 100
    const shouldVirtualize = itemCount >= virtualizeThreshold

    // Estimate memory savings
    const estimatedDOMNodes = shouldVirtualize ? 20 : itemCount
    const estimatedMemoryPerNode = 5000 // bytes
    const estimatedMemorySavings = (itemCount - estimatedDOMNodes) * estimatedMemoryPerNode

    // Estimate render time improvement
    const normalRenderTime = itemCount * 0.5 // 0.5ms per item
    const virtualizedRenderTime = estimatedDOMNodes * 0.5
    const renderTimeImprovement = normalRenderTime - virtualizedRenderTime

    return {
      shouldVirtualize,
      itemCount,
      estimatedDOMNodes,
      estimatedMemorySavings: Math.round(estimatedMemorySavings / 1024), // KB
      estimatedRenderTime: Math.round(virtualizedRenderTime),
      potentialImprovement: `${Math.round((renderTimeImprovement / normalRenderTime) * 100)}%`
    }
  }, [itemCount])
}
