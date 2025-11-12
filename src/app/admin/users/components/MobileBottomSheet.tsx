'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'

export interface MobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  height?: 'half' | 'full' | string
}

/**
 * Mobile Bottom Sheet Component
 *
 * Features:
 * - Smooth slide-up animation
 * - Drag handle for swipe-down close
 * - Proper z-index layering
 * - Backdrop dimming
 * - Safe area support (notch, etc.)
 * - Touch-friendly controls
 *
 * Usage:
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 * <MobileBottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <div>Content</div>
 * </MobileBottomSheet>
 * ```
 */
export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'half'
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const touchStartYRef = useRef(0)
  const touchStartTimeRef = useRef(0)

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    onClose()
  }, [onClose])

  // Handle swipe down gesture
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = e.touches[0].clientY
    touchStartTimeRef.current = Date.now()
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touchEndY = e.changedTouches[0].clientY
      const duration = Date.now() - touchStartTimeRef.current
      const distance = touchEndY - touchStartYRef.current

      // Swipe down: significant distance in short time
      if (distance > 50 && duration < 500) {
        onClose()
      }
    },
    [onClose]
  )

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const heightClass =
    height === 'half'
      ? 'max-h-[50vh]'
      : height === 'full'
        ? 'max-h-[90vh]'
        : `max-h-[${height}]`

  return (
    <>
      {/* Backdrop */}
      <div
        className="mobile-bottom-sheet-backdrop"
        onClick={handleBackdropClick}
        aria-hidden="true"
        data-testid="mobile-bottom-sheet-backdrop"
      />

      {/* Bottom Sheet Container */}
      <div
        ref={sheetRef}
        className={`mobile-bottom-sheet ${heightClass}`}
        data-testid="mobile-bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Drag Handle */}
        <div
          className="mobile-bottom-sheet-handle-wrapper"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          data-testid="mobile-bottom-sheet-handle-wrapper"
        >
          <div className="mobile-bottom-sheet-handle" />
        </div>

        {/* Header (optional) */}
        {title && (
          <div className="mobile-bottom-sheet-header">
            <h2 className="mobile-bottom-sheet-title">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="mobile-bottom-sheet-content">
          {children}
        </div>
      </div>
    </>
  )
}
