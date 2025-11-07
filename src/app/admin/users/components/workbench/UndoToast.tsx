'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, CheckCircle } from 'lucide-react'

interface UndoToastProps {
  operationId: string
  userCount?: number
  onDismiss?: () => void
  onUndo?: (operationId: string) => void | Promise<void>
  autoCloseDuration?: number
}

/**
 * UndoToast - Toast notification with undo button
 * 
 * Features:
 * - Success message with operation details
 * - Undo button to revert changes
 * - Auto-dismiss after time period
 * - Manual dismiss button
 * - Countdown timer for auto-close
 */
export default function UndoToast({
  operationId,
  userCount = 0,
  onDismiss,
  onUndo,
  autoCloseDuration = 10000
}: UndoToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(autoCloseDuration / 1000)
  const [isUndoing, setIsUndoing] = useState(false)

  // Auto-close timer
  useEffect(() => {
    if (!isVisible) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsVisible(false)
          onDismiss?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, onDismiss])

  const handleUndo = async () => {
    setIsUndoing(true)
    try {
      await onUndo?.(operationId)
      setIsVisible(false)
      onDismiss?.()
    } catch (error) {
      console.error('Error undoing operation:', error)
      setIsUndoing(false)
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="undo-toast-wrapper">
      <div className="undo-toast-container">
        <div className="undo-toast-content">
          <div className="undo-toast-message">
            <CheckCircle className="undo-toast-icon" />
            <div className="undo-toast-text">
              <p className="undo-toast-title">
                {userCount > 0 ? `Updated ${userCount} users` : 'Operation completed'}
              </p>
              <p className="undo-toast-subtitle">
                Undo available for {Math.ceil(timeRemaining)}s
              </p>
            </div>
          </div>

          <div className="undo-toast-actions">
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              disabled={isUndoing}
              className="undo-toast-button"
            >
              {isUndoing ? 'Undoing...' : 'Undo'}
            </Button>

            <button
              onClick={() => setIsVisible(false)}
              className="undo-toast-close"
              aria-label="Dismiss notification"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="undo-toast-progress">
          <div
            className="undo-toast-progress-bar"
            style={{
              width: `${(timeRemaining / (autoCloseDuration / 1000)) * 100}%`,
              transition: 'width 0.5s linear'
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .undo-toast-wrapper {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 50;
          max-width: 400px;
        }

        .undo-toast-container {
          background-color: white;
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .undo-toast-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem;
        }

        .undo-toast-message {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          flex: 1;
          min-width: 0;
        }

        .undo-toast-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #10b981;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .undo-toast-text {
          flex: 1;
        }

        .undo-toast-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text, #1e293b);
          margin: 0;
        }

        .undo-toast-subtitle {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #64748b);
          margin: 0.25rem 0 0 0;
        }

        .undo-toast-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .undo-toast-button {
          font-size: 0.75rem;
        }

        .undo-toast-close {
          padding: 0.375rem;
          border-radius: 0.375rem;
          background-color: transparent;
          border: none;
          color: var(--color-text-secondary, #64748b);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .undo-toast-close:hover {
          background-color: var(--color-bg-hover, rgba(0, 0, 0, 0.05));
          color: var(--color-text, #1e293b);
        }

        .undo-toast-close:focus-visible {
          outline: 2px solid var(--color-focus, #3b82f6);
          outline-offset: 2px;
        }

        .undo-toast-progress {
          height: 2px;
          background-color: var(--color-bg-subtle, #f1f5f9);
          width: 100%;
        }

        .undo-toast-progress-bar {
          height: 100%;
          background-color: #10b981;
        }

        @media (max-width: 640px) {
          .undo-toast-wrapper {
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
            max-width: none;
          }

          .undo-toast-content {
            padding: 0.875rem;
          }

          .undo-toast-message {
            gap: 0.5rem;
          }

          .undo-toast-title {
            font-size: 0.8125rem;
          }
        }

        @media (prefers-color-scheme: dark) {
          .undo-toast-container {
            background-color: var(--color-surface-dark, #1a202c);
            border-color: var(--color-border-dark, #334155);
          }

          .undo-toast-title {
            color: var(--color-text-dark, #f1f5f9);
          }

          .undo-toast-progress {
            background-color: var(--color-bg-dark-subtle, rgba(15, 23, 42, 0.5));
          }
        }
      `}</style>
    </div>
  )
}
