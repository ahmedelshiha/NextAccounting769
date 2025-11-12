'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

interface HealthServiceCardProps {
  name: string
  description: string
  status: 'healthy' | 'degraded' | 'unavailable' | 'unknown'
  latency: number
  error?: string
  icon?: string
}

export function HealthServiceCard({
  name,
  description,
  status,
  latency,
  error,
  icon,
}: HealthServiceCardProps) {
  const statusConfig = {
    healthy: {
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      badge: 'bg-green-100 text-green-800 border-green-300',
      text: 'Healthy',
      bgColor: 'bg-green-50',
    },
    degraded: {
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      text: 'Degraded',
      bgColor: 'bg-yellow-50',
    },
    unavailable: {
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      badge: 'bg-red-100 text-red-800 border-red-300',
      text: 'Unavailable',
      bgColor: 'bg-red-50',
    },
    unknown: {
      icon: <AlertCircle className="w-5 h-5 text-gray-600" />,
      badge: 'bg-gray-100 text-gray-800 border-gray-300',
      text: 'Unknown',
      bgColor: 'bg-gray-50',
    },
  }[status]

  return (
    <div className={`${statusConfig.bgColor} border border-gray-200 rounded-lg p-4 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          {icon && <span className="text-2xl mt-0.5">{icon}</span>}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm">{name}</h3>
            <p className="text-xs text-gray-600 mt-0.5">{description}</p>
          </div>
        </div>
        <Badge className={`${statusConfig.badge} border flex-shrink-0 text-xs`}>
          {statusConfig.text}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Response Time</span>
          <span className="text-sm font-mono font-semibold text-gray-900">
            {latency > 0 ? `${Math.round(latency)}ms` : '—'}
          </span>
        </div>

        {error && (
          <div className="bg-white rounded p-2 border border-gray-200">
            <p className="text-xs text-gray-700 font-medium">
              <AlertCircle className="w-3 h-3 inline mr-1 -mt-0.5" />
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            status === 'healthy'
              ? 'bg-green-500 w-full'
              : status === 'degraded'
                ? 'bg-yellow-500 w-2/3'
                : 'bg-red-500 w-1/3'
          }`}
          role="progressbar"
          aria-valuenow={
            status === 'healthy' ? 100 : status === 'degraded' ? 66 : 33
          }
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}

export default HealthServiceCard
