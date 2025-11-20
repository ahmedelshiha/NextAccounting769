'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SharedComponentProps } from '../types'
import { AlertCircle, CheckCircle2, AlertTriangle, InfoIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface NotificationBannerProps extends SharedComponentProps {
  /** Type of notification */
  type?: NotificationType
  /** Main message */
  title: string
  /** Additional description */
  description?: string
  /** Whether to show close button */
  closeable?: boolean
  /** Called when closed */
  onClose?: () => void
  /** Action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Auto-dismiss after ms (0 = no auto-dismiss) */
  autoDismiss?: number
}

/**
 * NotificationBanner Component
 *
 * Inline notification/alert banner for displaying messages.
 * Types: success, error, warning, info
 * Supports auto-dismiss, actions, and manual close.
 *
 * @example
 * ```tsx
 * // Success notification
 * <NotificationBanner
 *   type="success"
 *   title="Service created successfully"
 *   description="Your new tax service is now available"
 *   closeable
 *   onClose={() => setShowNotification(false)}
 * />
 *
 * // Error with action
 * <NotificationBanner
 *   type="error"
 *   title="Failed to save"
 *   description="Please check your input and try again"
 *   action={{
 *     label: 'Retry',
 *     onClick: handleRetry,
 *   }}
 * />
 * ```
 */
export default function NotificationBanner({
  type = 'info',
  title,
  description,
  closeable = true,
  onClose,
  action,
  autoDismiss = 0,
  className,
  testId,
}: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoDismiss > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, autoDismiss)
      return () => clearTimeout(timer)
    }
  }, [autoDismiss, onClose])

  if (!isVisible) {
    return null
  }

  const iconMap: Record<NotificationType, React.ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <InfoIcon className="h-5 w-5" />,
  }

  const bgColorMap: Record<NotificationType, string> = {
    success: 'bg-emerald-50 dark:bg-emerald-950',
    error: 'bg-red-50 dark:bg-red-950',
    warning: 'bg-amber-50 dark:bg-amber-950',
    info: 'bg-blue-50 dark:bg-blue-950',
  }

  const borderColorMap: Record<NotificationType, string> = {
    success: 'border-emerald-200 dark:border-emerald-800',
    error: 'border-red-200 dark:border-red-800',
    warning: 'border-amber-200 dark:border-amber-800',
    info: 'border-blue-200 dark:border-blue-800',
  }

  const textColorMap: Record<NotificationType, string> = {
    success: 'text-emerald-900 dark:text-emerald-100',
    error: 'text-red-900 dark:text-red-100',
    warning: 'text-amber-900 dark:text-amber-100',
    info: 'text-blue-900 dark:text-blue-100',
  }

  const iconColorMap: Record<NotificationType, string> = {
    success: 'text-emerald-600 dark:text-emerald-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-blue-600 dark:text-blue-400',
  }

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border px-4 py-3',
        bgColorMap[type],
        borderColorMap[type],
        textColorMap[type],
        className
      )}
      role="alert"
      data-testid={testId}
    >
      {/* Icon */}
      <div className={cn('mt-0.5 flex-shrink-0', iconColorMap[type])}>
        {iconMap[type]}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="mt-1 text-sm opacity-90">{description}</p>}

        {/* Action button */}
        {action && (
          <div className="mt-2">
            <Button
              size="sm"
              variant={
                type === 'error' || type === 'warning' ? 'destructive' : 'default'
              }
              onClick={action.onClick}
              className="font-medium"
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>

      {/* Close button */}
      {closeable && (
        <button
          onClick={handleClose}
          className={cn(
            'mt-0.5 flex-shrink-0 opacity-70 transition-opacity hover:opacity-100',
            iconColorMap[type]
          )}
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
