'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuditLogs } from '../../hooks/useAuditLogs'
import { Input } from '@/components/ui/input'

export function AuditTab() {
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month')

  const {
    logs,
    total,
    limit,
    offset,
    hasMore,
    isLoading,
    error,
    filters,
    actions,
    stats,
    updateFilters,
    exportLogs,
    goToNextPage,
    goToPreviousPage
  } = useAuditLogs()

  // Calculate date range for filter
  const getDateRange = (range: string) => {
    const now = new Date()
    switch (range) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        return { startDate: today, endDate: now }
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return { startDate: weekAgo, endDate: now }
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return { startDate: monthAgo, endDate: now }
      default:
        return {}
    }
  }

  const handleDateRangeChange = (range: 'today' | 'week' | 'month' | 'all') => {
    setDateRange(range)
    if (range === 'all') {
      updateFilters({ startDate: undefined, endDate: undefined })
    } else {
      const dateRange = getDateRange(range)
      updateFilters(dateRange)
    }
  }

  const getActionColor = (action: string): string => {
    if (action.includes('CREATE') || action.includes('ADD')) return 'bg-green-100 text-green-800'
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'bg-red-100 text-red-800'
    if (action.includes('UPDATE') || action.includes('CHANGE')) return 'bg-blue-100 text-blue-800'
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800'
    if (action.includes('APPROVE') || action.includes('REJECT')) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const currentPage = Math.floor((offset || 0) / (limit || 50)) + 1
  const totalPages = Math.ceil(total / (limit || 50))

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
          <p className="text-gray-600 text-sm mt-1">
            Track all user management operations for compliance and security
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
          >
            🔍 {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button
            onClick={exportLogs}
            disabled={isLoading || logs.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
            aria-label="Export audit logs"
          >
            📥 Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="text-sm font-medium text-gray-600">Total Logs (30 days)</div>
            <div className="text-3xl font-bold text-blue-900">{stats.totalLogs || 0}</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="text-sm font-medium text-gray-600">Top Actions</div>
            <div className="text-sm font-bold text-purple-900">
              {stats.logsByAction?.[0]?.action || 'N/A'}
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="text-sm font-medium text-gray-600">Most Active User</div>
            <div className="text-sm font-bold text-green-900">
              {stats.logsByUser?.length || 0} users
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="text-sm font-medium text-gray-600">Current Page</div>
            <div className="text-3xl font-bold text-orange-900">{currentPage}/{totalPages}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="p-6 border-blue-200 bg-blue-50">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['today', 'week', 'month', 'all'] as const).map(range => (
                  <Button
                    key={range}
                    variant={dateRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateRangeChange(range)}
                    className="capitalize"
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <Input
                  placeholder="Search actions or resources..."
                  value={filters.search || ''}
                  onChange={e => updateFilters({ search: e.target.value })}
                  className="bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <select
                  value={filters.action || ''}
                  onChange={e => updateFilters({ action: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm"
                >
                  <option value="">All Actions</option>
                  {actions.map(action => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resource
                </label>
                <Input
                  placeholder="Filter by resource..."
                  value={filters.resource || ''}
                  onChange={e => updateFilters({ resource: e.target.value || undefined })}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFilters({
                    search: undefined,
                    action: undefined,
                    resource: undefined,
                    startDate: undefined,
                    endDate: undefined
                  })
                  setDateRange('month')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200 text-red-700" role="alert">
          ⚠️ {error.message}
        </Card>
      )}

      {/* Audit Logs Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-semibold text-gray-900">No audit logs found</h3>
            <p className="text-gray-600 text-sm mt-2">
              No operations match your filter criteria
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Resource</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 font-medium">{log.user?.name || 'Unknown'}</div>
                      <div className="text-gray-600 text-xs">{log.user?.email || log.userId || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {log.resource || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} logs
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={offset === 0}
              aria-label="Previous page"
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={!hasMore}
              aria-label="Next page"
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Info section */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-3 text-gray-900">About Audit Logs</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ All user management operations are automatically logged</li>
          <li>✓ Logs are retained for 90 days</li>
          <li>✓ Use filters to find specific operations</li>
          <li>✓ Export logs for compliance reporting</li>
          <li>✓ Each entry includes user, timestamp, and IP address</li>
        </ul>
      </Card>
    </div>
  )
}
