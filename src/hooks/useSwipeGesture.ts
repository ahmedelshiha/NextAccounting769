import { useEffect, useRef, useCallback, useState } from 'react';

export interface SwipeGestureConfig {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  enabled?: boolean;
}

export interface SwipeState {
  isDragging: boolean;
  startX: number;
  currentX: number;
  progress: number;
}

export function useSwipeGesture({
  threshold = 50,
  onSwipeLeft,
  onSwipeRight,
  onSwipeStart,
  onSwipeEnd,
  enabled = true,
}: SwipeGestureConfig) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    startX: 0,
    currentX: 0,
    progress: 0,
  });

  const elementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      const touch = e.touches[0];
      setSwipeState((prev) => ({
        ...prev,
        isDragging: true,
        startX: touch.clientX,
        currentX: touch.clientX,
        progress: 0,
      }));
      onSwipeStart?.();
    },
    [enabled, onSwipeStart]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!swipeState.isDragging) return;

      const touch = e.touches[0];
      const distance = touch.clientX - swipeState.startX;
      const progress = Math.abs(distance) / (window.innerWidth / 2);

      setSwipeState((prev) => ({
        ...prev,
        currentX: touch.clientX,
        progress: Math.min(progress, 1),
      }));
    },
    [swipeState.isDragging, swipeState.startX]
  );

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.isDragging) return;

    const distance = swipeState.currentX - swipeState.startX;
    const isRtl = document.documentElement.dir === 'rtl';

    // Normalize swipe direction for RTL
    const normalizedDistance = isRtl ? -distance : distance;

    if (Math.abs(normalizedDistance) > threshold) {
      if (normalizedDistance > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }

    setSwipeState({
      isDragging: false,
      startX: 0,
      currentX: 0,
      progress: 0,
    });
    onSwipeEnd?.();
  }, [swipeState.isDragging, swipeState.currentX, swipeState.startX, threshold, onSwipeLeft, onSwipeRight, onSwipeEnd]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart as any);
    element.addEventListener('touchmove', handleTouchMove as any);
    element.addEventListener('touchend', handleTouchEnd as any);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart as any);
      element.removeEventListener('touchmove', handleTouchMove as any);
      element.removeEventListener('touchend', handleTouchEnd as any);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    elementRef,
    swipeState,
  };
}
