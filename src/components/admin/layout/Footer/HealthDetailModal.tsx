'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { HealthServiceCard } from './HealthServiceCard'
import { SystemHealth } from './types'
import { STATUS_MESSAGES } from './constants'

interface HealthDetailModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  health?: SystemHealth
  isLoading?: boolean
  error?: Error | null
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function HealthDetailModal({
  isOpen,
  onOpenChange,
  health,
  isLoading = false,
  error = null,
  onRefresh,
  isRefreshing = false,
}: HealthDetailModalProps) {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Setup auto-refresh interval
  useEffect(() => {
    if (!autoRefreshEnabled || !isOpen || isLoading) {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
        setAutoRefreshInterval(null)
      }
      return
    }

    const interval = setInterval(() => {
      onRefresh?.()
    }, 30000) // 30 seconds

    setAutoRefreshInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefreshEnabled, isOpen, isLoading, onRefresh])

  if (!health) return null

  const statusIcon = {
    healthy: <CheckCircle2 className="w-6 h-6 text-green-600" />,
    degraded: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
    unavailable: <XCircle className="w-6 h-6 text-red-600" />,
    unknown: <Clock className="w-6 h-6 text-gray-600" />,
  }[health.status]

  const statusMessage = STATUS_MESSAGES[health.status]
  const timestamp = new Date(health.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" showCloseButton>
        {/* Header Section */}
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">{statusIcon}</div>
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-2">System Health Status</DialogTitle>
                <DialogDescription className="text-base">
                  {statusMessage.full}
                </DialogDescription>
              </div>
            </div>
            <Badge className={`${getStatusColor(health.status)} border flex-shrink-0`}>
              {statusMessage.short.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800 font-medium">
              Unable to load health details: {error.message}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 animate-spin text-gray-600 mr-2" />
            <span className="text-gray-600">Loading health details...</span>
          </div>
        )}

        {/* Health Checks Grid */}
        {!isLoading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <HealthServiceCard
                name="Database"
                description="PostgreSQL Connection"
                status={health.checks.database.status}
                latency={health.checks.database.latency}
                error={health.checks.database.error}
                icon="🗄️"
              />

              {health.checks.redis && (
                <HealthServiceCard
                  name="Cache"
                  description="Redis Connection"
                  status={health.checks.redis.status}
                  latency={health.checks.redis.latency}
                  error={health.checks.redis.error}
                  icon="⚡"
                />
              )}

              <HealthServiceCard
                name="API"
                description="HTTP Response Time"
                status={health.checks.api.status}
                latency={health.checks.api.latency}
                error={health.checks.api.error}
                icon="🌐"
              />

              {health.checks.email && (
                <HealthServiceCard
                  name="Email"
                  description="SendGrid Configuration"
                  status={health.checks.email.status}
                  latency={health.checks.email.latency}
                  error={health.checks.email.error}
                  icon="📧"
                />
              )}

              {health.checks.auth && (
                <HealthServiceCard
                  name="Authentication"
                  description="NextAuth Configuration"
                  status={health.checks.auth.status}
                  latency={health.checks.auth.latency}
                  error={health.checks.auth.error}
                  icon="🔐"
                />
              )}
            </div>

            {/* Summary Stats */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Uptime</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {health.uptime ? `${(health.uptime / 3600).toFixed(1)}h` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Last Check</p>
                  <p className="text-sm font-mono text-gray-700">{timestamp}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Status</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {health.checks.database.latency ? `${Math.round(health.checks.database.latency)}ms` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Controls */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefreshEnabled}
                  onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  aria-label="Enable auto-refresh"
                />
                <label htmlFor="auto-refresh" className="text-sm text-gray-700 cursor-pointer">
                  Auto-refresh (30s)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  aria-label="Manually refresh health status"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default HealthDetailModal
