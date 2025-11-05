'use client'

import React from 'react'
import { WorkstationMainContentProps } from '../../types/workstation'
import './workstation.css'

/**
 * WorkstationMainContent Component
 * Central area containing:
 * - Quick actions bar
 * - Operations overview cards
 * - User directory table
 * - Pagination controls
 */
export function WorkstationMainContent({
  users,
  stats,
  isLoading = false,
  onAddUser,
  onImport,
  onBulkOperation,
  onExport,
  onRefresh,
  className
}: WorkstationMainContentProps) {
  return (
    <div className={`workstation-main-content ${className || ''}`}>
      {/* Quick Actions Bar */}
      <section className="main-section actions-section">
        <div className="quick-actions-container">
          {onAddUser && (
            <button onClick={onAddUser} className="action-btn add-btn">
              Add User
            </button>
          )}
          {onImport && (
            <button onClick={onImport} className="action-btn import-btn">
              Import
            </button>
          )}
          {onExport && (
            <button onClick={onExport} className="action-btn export-btn">
              Export
            </button>
          )}
          {onRefresh && (
            <button
              onClick={() => onRefresh()}
              className="action-btn refresh-btn"
              disabled={isLoading}
            >
              Refresh
            </button>
          )}
        </div>
      </section>

      {/* Operations Overview Cards */}
      {stats && (
        <section className="main-section metrics-section">
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Total Users</span>
              <span className="metric-value">-</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Pending</span>
              <span className="metric-value">-</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">In Progress</span>
              <span className="metric-value">-</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Due This Week</span>
              <span className="metric-value">-</span>
            </div>
          </div>
        </section>
      )}

      {/* User Directory Header */}
      <section className="main-section directory-header">
        <h2 className="directory-title">User Directory</h2>
      </section>

      {/* User Directory Table */}
      <section className="main-section directory-section">
        <div className="users-table-container">
          {isLoading ? (
            <div className="loading-state">Loading users...</div>
          ) : users && users.length > 0 ? (
            <div className="table-placeholder">
              Table component will be integrated here with {users.length} users
            </div>
          ) : (
            <div className="empty-state">No users found</div>
          )}
        </div>
      </section>

      {/* Pagination Controls */}
      <section className="main-section pagination-section">
        <div className="pagination-container">
          <span className="pagination-info">Page 1 of 1</span>
        </div>
      </section>
    </div>
  )
}

export default WorkstationMainContent
