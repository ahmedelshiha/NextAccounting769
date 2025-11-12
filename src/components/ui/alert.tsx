'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

export function Alert({ children, className, variant = 'default' }: { children: React.ReactNode; className?: string; variant?: 'default' | 'destructive' }) {
  const base = 'rounded-lg border p-3 flex items-start gap-3'
  const vclass = variant === 'destructive' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-800'
  return (
    <div className={`${base} ${vclass} ${className || ''}`} role="alert">
      <AlertCircle className="h-4 w-4" />
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function AlertDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm ${className || ''}`}>{children}</div>
}

export function AlertTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h4 className={`font-semibold ${className || ''}`}>{children}</h4>
}

export default Alert
