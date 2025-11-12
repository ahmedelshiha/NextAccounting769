import { useEffect, useRef, useCallback } from 'react'

/**
 * Scroll Performance Metrics
 */
export interface ScrollPerformanceMetrics {
  fps: number
  avgFrameTime: number
  droppedFrames: number
  totalFrames: number
  scrollDistance: number
  averageScrollSpeed: number
  isScrolling: boolean
}

/**
 * useScrollPerformance Hook
 *
 * Monitors scroll performance metrics including:
 * - FPS (frames per second)
 * - Frame time (milliseconds)
 * - Dropped frames detection
 * - Scroll velocity
 * - Overall scrolling smoothness
 *
 * Useful for measuring virtualization benefits and detecting performance issues
 *
 * @param containerRef - Ref to the scrollable container element
 * @param onMetricsUpdate - Callback fired with metrics every second
 * @returns Current performance metrics
 *
 * @example
 * const containerRef = useRef<HTMLDivElement>(null)
 * const metrics = useScrollPerformance(containerRef, (m) => {
 *   console.log(`Scroll FPS: ${m.fps}`)
 * })
 */
export function useScrollPerformance(
  containerRef: React.RefObject<HTMLElement>,
  onMetricsUpdate?: (metrics: ScrollPerformanceMetrics) => void
): ScrollPerformanceMetrics {
  const metricsRef = useRef<ScrollPerformanceMetrics>({
    fps: 60,
    avgFrameTime: 16.67,
    droppedFrames: 0,
    totalFrames: 0,
    scrollDistance: 0,
    averageScrollSpeed: 0,
    isScrolling: false
  })

  const frameTimesRef = useRef<number[]>([])
  const lastFrameTimeRef = useRef<number>(performance.now())
  const lastScrollTopRef = useRef<number>(0)
  const lastScrollTimeRef = useRef<number>(performance.now())
  const scrollSpeedsRef = useRef<number[]>([])
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const rafRef = useRef<number | null>(null)

  // Measure frame time with requestAnimationFrame
  const measureFrame = useCallback(() => {
    const now = performance.now()
    const frameTime = now - lastFrameTimeRef.current

    // Track frame times (keep last 60 frames)
    frameTimesRef.current.push(frameTime)
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift()
    }

    // Detect dropped frames (> 16.67ms for 60fps = frame drop)
    if (frameTime > 16.67) {
      metricsRef.current.droppedFrames++
    }

    metricsRef.current.totalFrames++

    // Calculate average frame time
    const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
    metricsRef.current.avgFrameTime = avgFrameTime

    // Calculate FPS (1000ms / avgFrameTime)
    metricsRef.current.fps = Math.round(1000 / avgFrameTime)

    lastFrameTimeRef.current = now
    rafRef.current = requestAnimationFrame(measureFrame)
  }, [])

  // Handle scroll events
  const handleScroll = useCallback(
    (e: Event) => {
      const container = e.target as HTMLElement
      const now = performance.now()
      const scrollDelta = container.scrollTop - lastScrollTopRef.current

      // Calculate scroll speed (pixels per millisecond)
      const scrollSpeed = Math.abs(scrollDelta) / Math.max(1, now - lastScrollTimeRef.current)
      scrollSpeedsRef.current.push(scrollSpeed)

      // Keep last 10 scroll measurements
      if (scrollSpeedsRef.current.length > 10) {
        scrollSpeedsRef.current.shift()
      }

      // Update metrics
      metricsRef.current.scrollDistance += Math.abs(scrollDelta)
      metricsRef.current.averageScrollSpeed =
        scrollSpeedsRef.current.reduce((a, b) => a + b, 0) / scrollSpeedsRef.current.length
      metricsRef.current.isScrolling = true

      lastScrollTopRef.current = container.scrollTop
      lastScrollTimeRef.current = now

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // Mark as not scrolling after 150ms of inactivity
      scrollTimeoutRef.current = setTimeout(() => {
        metricsRef.current.isScrolling = false
      }, 150)
    },
    []
  )

  // Metrics update interval
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Start frame measurement
    rafRef.current = requestAnimationFrame(measureFrame)

    // Attach scroll listener
    container.addEventListener('scroll', handleScroll, { passive: true })

    // Update metrics every second
    const intervalId = setInterval(() => {
      onMetricsUpdate?.(metricsRef.current)
    }, 1000)

    return () => {
      // Cleanup
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      if (intervalId) clearInterval(intervalId)
      container.removeEventListener('scroll', handleScroll)
    }
  }, [containerRef, measureFrame, handleScroll, onMetricsUpdate])

  return metricsRef.current
}

/**
 * Helper: Log scroll performance metrics to console
 * Useful for debugging and performance analysis
 */
export function logScrollMetrics(metrics: ScrollPerformanceMetrics) {
  console.group('📊 Scroll Performance Metrics')
  console.log(`🎬 FPS: ${metrics.fps} (avg frame time: ${metrics.avgFrameTime.toFixed(2)}ms)`)
  console.log(`⚡ Dropped frames: ${metrics.droppedFrames}/${metrics.totalFrames}`)
  console.log(`📏 Scroll distance: ${metrics.scrollDistance.toFixed(0)}px`)
  console.log(`🚀 Scroll speed: ${metrics.averageScrollSpeed.toFixed(2)}px/ms`)
  console.log(`📍 Status: ${metrics.isScrolling ? 'Scrolling' : 'Idle'}`)
  console.groupEnd()
}

/**
 * Helper: Detect if scroll performance is degraded
 * Returns severity level: 'good' | 'ok' | 'poor'
 */
export function getScrollPerformanceLevel(metrics: ScrollPerformanceMetrics): 'good' | 'ok' | 'poor' {
  if (metrics.fps >= 55) return 'good'
  if (metrics.fps >= 45) return 'ok'
  return 'poor'
}

/**
 * Hook to track virtualization performance improvements
 * Compares metrics before and after virtualization
 */
export function useVirtualizationBenefit(
  isVirtualized: boolean,
  onMetricsChange?: (metrics: { virtualized: ScrollPerformanceMetrics; improvement: number }) => void
) {
  const virtualizationMetricsRef = useRef<{
    virtualized?: ScrollPerformanceMetrics
    nonVirtualized?: ScrollPerformanceMetrics
  }>({})

  const handleMetricsUpdate = useCallback(
    (metrics: ScrollPerformanceMetrics) => {
      if (isVirtualized) {
        virtualizationMetricsRef.current.virtualized = metrics
      } else {
        virtualizationMetricsRef.current.nonVirtualized = metrics
      }

      // Calculate improvement percentage
      if (virtualizationMetricsRef.current.virtualized && virtualizationMetricsRef.current.nonVirtualized) {
        const fpsImprovement =
          ((virtualizationMetricsRef.current.virtualized.fps -
            virtualizationMetricsRef.current.nonVirtualized.fps) /
            virtualizationMetricsRef.current.nonVirtualized.fps) *
          100

        onMetricsChange?.({
          virtualized: virtualizationMetricsRef.current.virtualized,
          improvement: Math.round(fpsImprovement)
        })
      }
    },
    [isVirtualized, onMetricsChange]
  )

  return { handleMetricsUpdate }
}
