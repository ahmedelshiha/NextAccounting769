'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

export type GestureType = 'swipe' | 'long-press' | 'double-tap'
export type SwipeDirection = 'up' | 'down' | 'left' | 'right'

export interface GestureEvent {
  type: GestureType
  direction?: SwipeDirection
  target: Element
  timestamp: number
  distance?: number
  duration?: number
}

export interface UseGestureDetectionOptions {
  onSwipe?: (direction: SwipeDirection, distance: number) => void
  onLongPress?: () => void
  onDoubleTap?: () => void
  swipeThreshold?: number // minimum distance to register as swipe
  swipeDuration?: number // maximum duration to register as swipe
  longPressThreshold?: number // duration for long press
  doubleTapDelay?: number // delay between taps for double tap
}

/**
 * Gesture Detection Hook
 *
 * Detects touch gestures on mobile devices:
 * - Swipe (up, down, left, right)
 * - Long press
 * - Double tap
 *
 * Usage:
 * ```tsx
 * const ref = useRef(null)
 * useGestureDetection(ref, {
 *   onSwipe: (direction) => console.log('Swiped', direction),
 *   onLongPress: () => console.log('Long pressed'),
 * })
 * return <div ref={ref}>Content</div>
 * ```
 */
export function useGestureDetection(
  ref: React.RefObject<HTMLElement>,
  options: UseGestureDetectionOptions = {}
) {
  const {
    onSwipe,
    onLongPress,
    onDoubleTap,
    swipeThreshold = 50,
    swipeDuration = 500,
    longPressThreshold = 500,
    doubleTapDelay = 300
  } = options

  const touchStartYRef = useRef(0)
  const touchStartXRef = useRef(0)
  const touchStartTimeRef = useRef(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTapRef = useRef({ time: 0, target: null as Element | null })

  const [gesture, setGesture] = useState<GestureEvent | null>(null)

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      touchStartXRef.current = e.touches[0].clientX
      touchStartYRef.current = e.touches[0].clientY
      touchStartTimeRef.current = Date.now()

      // Set long press timer
      clearLongPressTimer()
      longPressTimerRef.current = setTimeout(() => {
        const event: GestureEvent = {
          type: 'long-press',
          target: e.target as Element,
          timestamp: Date.now()
        }
        setGesture(event)
        onLongPress?.()
      }, longPressThreshold)
    },
    [longPressThreshold, onLongPress, clearLongPressTimer]
  )

  // Handle touch end
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      clearLongPressTimer()

      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY
      const duration = Date.now() - touchStartTimeRef.current

      const deltaX = touchEndX - touchStartXRef.current
      const deltaY = touchEndY - touchStartYRef.current
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Detect swipe
      if (distance > swipeThreshold && duration < swipeDuration) {
        const direction: SwipeDirection = Math.abs(deltaX) > Math.abs(deltaY)
          ? deltaX > 0
            ? 'right'
            : 'left'
          : deltaY > 0
            ? 'down'
            : 'up'

        const event: GestureEvent = {
          type: 'swipe',
          direction,
          target: e.target as Element,
          timestamp: Date.now(),
          distance,
          duration
        }
        setGesture(event)
        onSwipe?.(direction, distance)
      }

      // Detect double tap
      const now = Date.now()
      if (
        lastTapRef.current.time &&
        now - lastTapRef.current.time < doubleTapDelay &&
        lastTapRef.current.target === e.target
      ) {
        const event: GestureEvent = {
          type: 'double-tap',
          target: e.target as Element,
          timestamp: Date.now()
        }
        setGesture(event)
        onDoubleTap?.()
        lastTapRef.current = { time: 0, target: null }
      } else {
        lastTapRef.current = { time: now, target: e.target as Element }
      }
    },
    [
      swipeThreshold,
      swipeDuration,
      doubleTapDelay,
      onSwipe,
      onDoubleTap,
      clearLongPressTimer
    ]
  )

  // Attach touch listeners
  useEffect(() => {
    if (!ref.current) return

    const element = ref.current
    element.addEventListener('touchstart', handleTouchStart as any, { passive: true })
    element.addEventListener('touchend', handleTouchEnd as any, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart as any)
      element.removeEventListener('touchend', handleTouchEnd as any)
      clearLongPressTimer()
    }
  }, [ref, handleTouchStart, handleTouchEnd, clearLongPressTimer])

  return gesture
}

/**
 * Hook for detecting specific swipe directions
 */
export function useSwipe(
  ref: React.RefObject<HTMLElement>,
  callback: (direction: SwipeDirection) => void
) {
  return useGestureDetection(ref, {
    onSwipe: callback
  })
}

/**
 * Hook for detecting long press
 */
export function useLongPress(
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  threshold = 500
) {
  return useGestureDetection(ref, {
    onLongPress: callback,
    longPressThreshold: threshold
  })
}

/**
 * Hook for detecting double tap
 */
export function useDoubleTap(
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  delay = 300
) {
  return useGestureDetection(ref, {
    onDoubleTap: callback,
    doubleTapDelay: delay
  })
}
