'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BulkOperationsWizard } from '../bulk-operations'
import { useSession } from 'next-auth/react'

/**
 * Bulk Operations Tab - Phase 4c Implementation
 *
 * Features:
 * - Multi-step bulk operation wizard (5 steps)
 * - User selection with advanced filtering
 * - Operation configuration and preview
 * - Dry-run capability
 * - Large-scale execution (1000+ users)
 * - Rollback capability within 30 days
 * - Operation history and results
 *
 * Status: Phase 4c (Week 5-6, 45 hours)
 */

interface BulkOperation {
  id: string
  name: string
  type: string
  status: string
  totalUsersAffected: number
  successCount: number
  failureCount: number
  createdAt: string
  createdBy: string
}

export function BulkOperationsTab() {
  const { data: session } = useSession()
  const [showWizard, setShowWizard] = useState(false)
  const [operations, setOperations] = useState<BulkOperation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const tenantId = (session?.user as any)?.tenantId

  // Fetch operations list
  useEffect(() => {
    if (!tenantId) return

    const fetchOperations = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/admin/bulk-operations?tenantId=${tenantId}&limit=20`,
          { method: 'GET' }
        )

        if (!response.ok) throw new Error('Failed to fetch operations')

        const data = await response.json()
        setOperations(data.operations || [])
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchOperations()
  }, [tenantId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">✓ Completed</Badge>
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <span className="inline-block animate-spin mr-1">⏳</span>
            In Progress
          </Badge>
        )
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">✗ Failed</Badge>
      case 'DRAFT':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (showWizard) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowWizard(false)}
            className="mb-4"
          >
            ← Back to Operations List
          </Button>
        </div>
        <BulkOperationsWizard
          tenantId={tenantId}
          onClose={() => setShowWizard(false)}
        />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bulk Operations</h2>
          <p className="text-gray-600 text-sm mt-1">
            Execute batch operations on multiple users at scale
          </p>
        </div>
        <Button
          onClick={() => setShowWizard(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + New Operation
        </Button>
      </div>

      {/* Features overview */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl">🎯</div>
            <div className="text-xs font-medium mt-2">Multi-step Wizard</div>
          </div>
          <div className="text-center">
            <div className="text-2xl">👥</div>
            <div className="text-xs font-medium mt-2">Smart Filtering</div>
          </div>
          <div className="text-center">
            <div className="text-2xl">👁️</div>
            <div className="text-xs font-medium mt-2">Preview & Dry-Run</div>
          </div>
          <div className="text-center">
            <div className="text-2xl">⚡</div>
            <div className="text-xs font-medium mt-2">Fast Execution</div>
          </div>
          <div className="text-center">
            <div className="text-2xl">↩️</div>
            <div className="text-xs font-medium mt-2">Rollback (30 days)</div>
          </div>
        </div>
      </Card>

      {/* Operations list */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Recent Operations</h3>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : operations.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-2">📋</div>
            <h3 className="font-semibold">No operations yet</h3>
            <p className="text-gray-600 text-sm mt-2">
              Create your first bulk operation to get started
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {operations.map(op => (
              <Card key={op.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{op.name}</h4>
                      {getStatusBadge(op.status)}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      Type: <strong>{op.type}</strong> • Users: <strong>{op.totalUsersAffected}</strong>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(op.createdAt)}
                    </p>
                  </div>

                  {/* Stats */}
                  {(op.successCount > 0 || op.failureCount > 0) && (
                    <div className="flex gap-3 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-green-600">{op.successCount}</div>
                        <div className="text-xs text-gray-500">Success</div>
                      </div>
                      {op.failureCount > 0 && (
                        <div className="text-center">
                          <div className="font-bold text-red-600">{op.failureCount}</div>
                          <div className="text-xs text-gray-500">Failed</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                    {op.status === 'DRAFT' && (
                      <Button variant="ghost" size="sm" className="text-red-600">
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Help section */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-3">How it works</h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li>
            <strong>1. Select Users:</strong> Choose which users to affect using filters and search
          </li>
          <li>
            <strong>2. Choose Operation:</strong> Pick the action to perform (role change, permissions, etc)
          </li>
          <li>
            <strong>3. Configure:</strong> Set specific parameters for the operation
          </li>
          <li>
            <strong>4. Preview:</strong> Run a dry-run to see the impact before executing
          </li>
          <li>
            <strong>5. Execute:</strong> Run the operation and monitor progress
          </li>
        </ol>
      </Card>
    </div>
  )
}
