"use client";

import React, { useState, useCallback } from "react";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { ChevronRight } from "lucide-react";

export interface SwipeToConfirmProps {
  text?: string;
  onSwipeComplete: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  successText?: string;
}

export function SwipeToConfirm({
  text = "Swipe to confirm",
  onSwipeComplete,
  disabled = false,
  isLoading = false,
  className = "",
  successText = "Setting up...",
}: SwipeToConfirmProps) {
  const [isCompleted, setIsCompleted] = useState(false);

  const handleSwipeComplete = useCallback(() => {
    if (disabled || isLoading) return;
    setIsCompleted(true);
    onSwipeComplete();
  }, [disabled, isLoading, onSwipeComplete]);

  const { elementRef, swipeState } = useSwipeGesture({
    threshold: 150,
    onSwipeRight: handleSwipeComplete,
    enabled: !disabled && !isLoading && !isCompleted,
  });

  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  return (
    <div
      ref={elementRef}
      className={`relative h-14 w-full rounded-lg overflow-hidden cursor-grab active:cursor-grabbing bg-gradient-to-r from-blue-600 to-blue-700 select-none ${
        disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      <div className="absolute inset-0 flex items-center justify-center text-white font-semibold text-sm pointer-events-none">
        {isCompleted ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {successText}
          </span>
        ) : (
          text
        )}
      </div>

      <div
        className="absolute inset-y-0 left-0 bg-white/20 rounded-lg transition-all flex items-center justify-center"
        style={{
          width: isRtl
            ? `${100 - swipeState.progress * 100}%`
            : `${swipeState.progress * 100}%`,
          willChange: "width",
        }}
      >
        {swipeState.progress > 0.3 && (
          <ChevronRight
            className={`h-5 w-5 text-white transition-opacity ${
              swipeState.progress < 0.8 ? "opacity-50" : "opacity-100"
            }`}
            style={{
              transform: isRtl ? "scaleX(-1)" : "none",
            }}
          />
        )}
      </div>
    </div>
  );
}
