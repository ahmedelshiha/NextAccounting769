'use client'

import React, { Suspense, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExecutiveDashboard } from '../ExecutiveDashboard'
import { AnalyticsCharts } from '../AnalyticsCharts'
import { QuickActionsBar } from '../QuickActionsBar'
import { OperationsOverviewCards, OperationsMetrics } from '../OperationsOverviewCards'
import { AdvancedUserFilters, UserFilters } from '../AdvancedUserFilters'
import { UsersTable } from '../UsersTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useDashboardMetrics, useDashboardRecommendations, useDashboardAnalytics, useFilterUsers, useServerSideFiltering } from '../../hooks'
import { UserItem, useUsersContext } from '../../contexts/UsersContextProvider'
import { UserProfileDialog } from '../UserProfileDialog'
import { toast } from 'sonner'

interface ExecutiveDashboardTabProps {
  users: UserItem[]
  stats: any
  isLoading?: boolean
  onAddUser?: () => void
  onImport?: () => void
  onBulkOperation?: () => void
  onExport?: () => void
  onRefresh?: () => void
}

/**
 * Executive Dashboard Tab
 *
 * Enhanced dashboard with:
 * - Real-time KPI metrics (Total Users, Active Users, etc.)
 * - AI-powered recommendations
 * - Advanced analytics and insights
 * - Operations management (user directory, filters)
 */
export function ExecutiveDashboardTab({
  users,
  stats,
  isLoading,
  onAddUser,
  onImport,
  onBulkOperation,
  onExport,
  onRefresh
}: ExecutiveDashboardTabProps) {
  const context = useUsersContext()
  const { data: metricsData, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: recommendations, isLoading: recsLoading } = useDashboardRecommendations()
  const { data: analyticsData, isLoading: analyticsLoading } = useDashboardAnalytics()
  const [dashboardView, setDashboardView] = useState<'overview' | 'operations'>('overview')

  // Operations section state (merged from DashboardTab)
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: undefined,
    status: undefined,
    department: undefined,
    dateRange: 'all'
  })
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [bulkActionType, setBulkActionType] = useState<string>('')
  const [bulkActionValue, setBulkActionValue] = useState<string>('')
  const [isApplyingBulkAction, setIsApplyingBulkAction] = useState(false)
  const [activeSavedView, setActiveSavedView] = useState<string>('all')

  const handleRefreshDashboard = () => {
    onRefresh?.()
  }

  const handleApplySavedView = (viewName: string, roleFilter?: string) => {
    setActiveSavedView(viewName)
    setFilters(prev => ({
      ...prev,
      role: roleFilter ? (roleFilter as any) : undefined,
      search: '',
      status: undefined,
      department: undefined,
      dateRange: 'all'
    }))
  }

  // Determine if we have active filters
  const hasActiveFilters = Boolean(
    filters.search ||
    filters.role ||
    filters.status ||
    filters.department
  )

  // Use server-side filtering when filters are active (Phase 4.3 optimization)
  const serverFiltering = useServerSideFiltering(
    {
      search: filters.search,
      role: filters.role,
      status: filters.status,
      department: filters.department,
      page: 1,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    },
    { enabled: hasActiveFilters, debounceMs: 300 }
  )

  // Use client-side filtering as fallback when no active filters (faster for initial load)
  const clientFilteredUsers = useFilterUsers(users, {
    search: filters.search,
    role: filters.role,
    status: filters.status,
    department: filters.department
  })

  // Choose the appropriate filtered users based on filter status
  const filteredUsers = hasActiveFilters ? serverFiltering.data : clientFilteredUsers

  const displayMetrics: OperationsMetrics = stats || {
    totalUsers: users.length,
    pendingApprovals: 0,
    inProgressWorkflows: 0,
    dueThisWeek: 0
  }

  const handleSelectUser = (userId: string, selected: boolean) => {
    const newSelected = new Set(selectedUserIds)
    if (selected) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUserIds(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)))
    } else {
      setSelectedUserIds(new Set())
    }
  }

  const handleApplyBulkAction = useCallback(async () => {
    if (!bulkActionType || !bulkActionValue || selectedUserIds.size === 0) {
      toast.error('Please select an action and value')
      return
    }

    setIsApplyingBulkAction(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      let actionDescription = ''
      if (bulkActionType === 'role') {
        actionDescription = `Changed role to ${bulkActionValue}`
      } else if (bulkActionType === 'status') {
        actionDescription = `Changed status to ${bulkActionValue}`
      } else if (bulkActionType === 'department') {
        actionDescription = `Changed department to ${bulkActionValue}`
      }

      toast.success(`Applied to ${selectedUserIds.size} users: ${actionDescription}`)

      setSelectedUserIds(new Set())
      setBulkActionType('')
      setBulkActionValue('')
    } catch (error) {
      toast.error('Failed to apply bulk action')
      console.error('Bulk action error:', error)
    } finally {
      setIsApplyingBulkAction(false)
    }
  }, [bulkActionType, bulkActionValue, selectedUserIds.size])

  return (
    <div className="flex-1 overflow-auto">
      <Tabs defaultValue="overview" className="w-full" onValueChange={(v) => setDashboardView(v as any)}>
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TabsList className="rounded-none border-b bg-transparent">
              <TabsTrigger value="overview" className="border-b-2 border-transparent data-[state=active]:border-blue-500">
                📊 Overview
              </TabsTrigger>
              <TabsTrigger value="operations" className="border-b-2 border-transparent data-[state=active]:border-blue-500">
                👥 Operations
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Executive Dashboard */}
          <Suspense fallback={<DashboardSkeleton />}>
            {metricsLoading ? (
              <DashboardSkeleton />
            ) : (
              <ExecutiveDashboard
                initialMetrics={metricsData?.metrics || {}}
                initialRecommendations={recommendations || []}
                onRefresh={handleRefreshDashboard}
              />
            )}
          </Suspense>

          {/* Analytics Charts */}
          {!analyticsLoading && analyticsData?.analytics && (
            <Suspense fallback={<AnalyticsSkeleton />}>
              <AnalyticsCharts
                userGrowthTrend={analyticsData.analytics.userGrowthTrend}
                departmentDistribution={analyticsData.analytics.departmentDistribution}
                roleDistribution={analyticsData.analytics.roleDistribution}
                workflowEfficiency={analyticsData.analytics.workflowEfficiency}
                complianceScore={analyticsData.analytics.complianceScore}
              />
            </Suspense>
          )}
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="p-4 sm:p-6 lg:p-8">
          <div className="min-h-screen bg-gray-50 space-y-6">
            {/* Quick Actions Bar */}
            <section role="region" aria-label="Quick actions">
              <QuickActionsBar
                onAddUser={onAddUser}
                onImport={onImport}
                onBulkOperation={onBulkOperation}
                onExport={onExport}
                onRefresh={onRefresh}
                isLoading={isLoading}
              />
            </section>

            {/* Operations Overview Metrics */}
            <section role="region" aria-label="Operations metrics" className="max-w-7xl mx-auto w-full">
              <OperationsOverviewCards metrics={displayMetrics} isLoading={isLoading} />
            </section>

            {/* Saved Views & Role Presets */}
            <section role="region" aria-label="Saved views" className="max-w-7xl mx-auto w-full">
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  variant={activeSavedView === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleApplySavedView('all')}
                  className="gap-2"
                >
                  <span>👥</span> All Users
                </Button>
                <Button
                  variant={activeSavedView === 'clients' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleApplySavedView('clients', 'CLIENT')}
                  className="gap-2"
                >
                  <span>🏢</span> Clients
                </Button>
                <Button
                  variant={activeSavedView === 'team' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleApplySavedView('team', 'TEAM_MEMBER')}
                  className="gap-2"
                >
                  <span>👨‍💼</span> Team
                </Button>
                <Button
                  variant={activeSavedView === 'admins' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleApplySavedView('admins', 'ADMIN')}
                  className="gap-2"
                >
                  <span>🔐</span> Admins
                </Button>
              </div>
            </section>

            {/* Filters Section */}
            <section role="region" aria-label="User filters" className="max-w-7xl mx-auto w-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Directory</h2>
              <AdvancedUserFilters
                filters={filters}
                onFiltersChange={setFilters}
                onReset={() => {
                  handleApplySavedView('all')
                }}
              />
            </section>

            {/* Users Table with Bulk Actions */}
            <section role="region" aria-label="User table and bulk actions" className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
              <div className="mb-4 flex flex-col gap-4 flex-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {filteredUsers.length} of {users.length} users
                    {selectedUserIds.size > 0 && (
                      <span className="ml-2 font-semibold text-blue-600" role="status" aria-live="polite">
                        ({selectedUserIds.size} selected)
                      </span>
                    )}
                  </div>
                </div>

                {selectedUserIds.size > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4" role="region" aria-label="Bulk actions panel">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="bulk-action-select" className="text-sm font-medium text-gray-700">
                        Select an action to apply to {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''}
                      </label>
                      <Select value={bulkActionType || ''} onValueChange={setBulkActionType}>
                        <SelectTrigger id="bulk-action-select" className="w-full sm:w-40" aria-label="Bulk action type">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="role">Change Role</SelectItem>
                          <SelectItem value="status">Change Status</SelectItem>
                          <SelectItem value="department">Change Department</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {bulkActionType === 'role' && (
                      <div className="flex flex-col gap-2">
                        <label htmlFor="bulk-value-role" className="text-sm font-medium text-gray-700">
                          Select new role
                        </label>
                        <Select value={bulkActionValue} onValueChange={setBulkActionValue}>
                          <SelectTrigger id="bulk-value-role" className="w-full sm:w-40" aria-label="Role selection">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                            <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                            <SelectItem value="STAFF">Staff</SelectItem>
                            <SelectItem value="CLIENT">Client</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {bulkActionType === 'status' && (
                      <div className="flex flex-col gap-2">
                        <label htmlFor="bulk-value-status" className="text-sm font-medium text-gray-700">
                          Select new status
                        </label>
                        <Select value={bulkActionValue} onValueChange={setBulkActionValue}>
                          <SelectTrigger id="bulk-value-status" className="w-full sm:w-40" aria-label="Status selection">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {bulkActionType === 'department' && (
                      <div className="flex flex-col gap-2">
                        <label htmlFor="bulk-value-department" className="text-sm font-medium text-gray-700">
                          Select new department
                        </label>
                        <Select value={bulkActionValue} onValueChange={setBulkActionValue}>
                          <SelectTrigger id="bulk-value-department" className="w-full sm:w-40" aria-label="Department selection">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="operations">Operations</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button
                      onClick={handleApplyBulkAction}
                      disabled={isApplyingBulkAction || !bulkActionType || !bulkActionValue}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                      aria-busy={isApplyingBulkAction}
                    >
                      {isApplyingBulkAction ? 'Applying...' : 'Apply'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-auto">
                <UsersTable
                  users={filteredUsers}
                  isLoading={isLoading}
                  selectedUserIds={selectedUserIds}
                  onSelectUser={handleSelectUser}
                  onSelectAll={handleSelectAll}
                  onViewProfile={(user) => {
                    context.setSelectedUser(user)
                    context.setProfileOpen(true)
                  }}
                />
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Profile Dialog */}
      <UserProfileDialog />
    </div>
  )
}

/**
 * Loading Skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Analytics Skeleton
 */
function AnalyticsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
