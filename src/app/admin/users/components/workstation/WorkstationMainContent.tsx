'use client'

import { memo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { WorkstationMainContentProps } from '../../types/workstation'
import './workstation.css'

export const WorkstationMainContent = memo(function WorkstationMainContent({
  users,
  stats,
  isLoading,
  onAddUser,
  onImport,
  onBulkOperation,
  onExport,
  onRefresh,
}: WorkstationMainContentProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      if (onRefresh) {
        await onRefresh()
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="workstation-main-content">
      {/* Quick Actions Section */}
      <section className="main-section actions-section" aria-label="Quick Actions">
        <div className="quick-actions-container">
          <button
            className="action-btn"
            onClick={onAddUser}
            aria-label="Add new user"
          >
            + Add User
          </button>
          <button
            className="action-btn"
            onClick={onImport}
            aria-label="Import users"
          >
            ⬆ Import
          </button>
          <button
            className="action-btn"
            onClick={onBulkOperation}
            aria-label="Bulk operations"
          >
            ⚙ Bulk
          </button>
          <button
            className="action-btn"
            onClick={onExport}
            aria-label="Export user list"
          >
            ⬇ Export
          </button>
          <button
            className="action-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh user list"
          >
            {isRefreshing ? (
              <>
                <Loader2 size={16} className="animate-spin mr-1" />
                Refreshing...
              </>
            ) : (
              '🔄 Refresh'
            )}
          </button>
        </div>
      </section>

      {/* Metrics Cards Section */}
      {stats && (
        <section className="main-section metrics-section" aria-label="User Metrics">
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Total Users</span>
              <span className="metric-value">{stats.total || 0}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Pending</span>
              <span className="metric-value">0</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">In Progress</span>
              <span className="metric-value">0</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Due This Week</span>
              <span className="metric-value">0</span>
            </div>
          </div>
        </section>
      )}

      {/* User Directory Section */}
      <section className="main-section directory-section" aria-label="User Directory">
        <header className="directory-header">
          <h2 className="directory-title">User Directory</h2>
          {users && (
            <span className="text-sm text-muted-foreground">
              {users.length} users
            </span>
          )}
        </header>

        {isLoading && (
          <div className="loading-state">
            <Loader2 className="animate-spin mr-2" />
            Loading user directory...
          </div>
        )}

        {!isLoading && users && users.length === 0 && (
          <div className="empty-state">
            No users found. Try adjusting your filters or create a new user.
          </div>
        )}

        {!isLoading && users && users.length > 0 && (
          <div className="users-table-container">
            {/* UsersTable component will be integrated here in Phase 2 */}
            <div className="table-placeholder">
              📋 Users Table Component (Phase 2 Integration)
              <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                {users.length} users loaded
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Pagination Section */}
      <section className="main-section pagination-section" aria-label="Pagination">
        <div className="pagination-container">
          <span className="pagination-info">
            Page 1 of {users && users.length > 0 ? Math.ceil(users.length / 50) : 1}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="action-btn" disabled aria-label="Previous page">
              ← Previous
            </button>
            <button className="action-btn" disabled aria-label="Next page">
              Next →
            </button>
          </div>
        </div>
      </section>

      {/* Bulk Actions Panel - Will appear when users are selected (Phase 2) */}
      <div className="bulk-actions-panel-placeholder" style={{ display: 'none' }}>
        {/* BulkActionsPanel component will be integrated here in Phase 2 */}
      </div>
    </div>
  )
})
