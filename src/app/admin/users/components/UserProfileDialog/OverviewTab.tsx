'use client'

import React, { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Building, Calendar, Clock, Shield, Activity as ActivityIcon } from 'lucide-react'
import { UserItem } from '../../contexts/UsersContextProvider'
import { useUsersContext } from '../../contexts/UsersContextProvider'

interface OverviewTabProps {
  user: UserItem
}

const formatDate = (iso?: string) => {
  if (!iso) return 'Never'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Invalid date'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const daysSince = (iso?: string) => {
  if (!iso) return 0
  const start = new Date(iso).getTime()
  if (Number.isNaN(start)) return 0
  const now = Date.now()
  return Math.max(0, Math.floor((now - start) / (24 * 60 * 60 * 1000)))
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'TEAM_MEMBER':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'TEAM_LEAD':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'STAFF':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'CLIENT':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'SUSPENDED':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-green-100 text-green-800 border-green-200'
  }
}

export const OverviewTab = memo(function OverviewTab({ user }: OverviewTabProps) {
  const { setActiveTab, setEditMode, setPermissionModalOpen } = useUsersContext()

  const handleEditClick = useCallback(() => {
    setActiveTab('details')
    setEditMode(true)
  }, [setActiveTab, setEditMode])

  const handleManagePermissions = useCallback(() => {
    setPermissionModalOpen(true)
  }, [setPermissionModalOpen])

  return (
    <div className="space-y-6">
      {/* User Header Card */}
      <div className="rounded-lg overflow-hidden border">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-semibold text-gray-900 truncate">{user.name || 'Unnamed User'}</div>
              <div className="text-sm text-gray-600 truncate">{user.email}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                <Badge className={getStatusColor(user.status)}>{user.status || 'ACTIVE'}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border rounded-md p-3">
            <div className="text-xs text-gray-500">Total Bookings</div>
            <div className="text-xl font-bold text-gray-900">{user.totalBookings ?? 0}</div>
          </div>
          <div className="bg-white border rounded-md p-3">
            <div className="text-xs text-gray-500">Total Revenue</div>
            <div className="text-xl font-bold text-gray-900">${(user.totalRevenue ?? 0).toLocaleString()}</div>
          </div>
          <div className="bg-white border rounded-md p-3">
            <div className="text-xs text-gray-500">Days Active</div>
            <div className="text-xl font-bold text-gray-900">{daysSince(user.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Contact & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">Email</div>
              <div className="text-sm text-gray-600">{user.email}</div>
            </div>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Phone</div>
                <div className="text-sm text-gray-600">{user.phone}</div>
              </div>
            </div>
          )}
          {user.company && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Company</div>
                <div className="text-sm text-gray-600">{user.company}</div>
              </div>
            </div>
          )}
          {user.location && (
            <div className="flex items-center gap-2">
              <div>
                <div className="text-sm font-medium text-gray-900">Location</div>
                <div className="text-sm text-gray-600">{user.location}</div>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">Joined</div>
              <div className="text-sm text-gray-600">{formatDate(user.createdAt)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">Last Login</div>
              <div className="text-sm text-gray-600">{formatDate(user.lastLoginAt)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">Role</div>
              <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ActivityIcon className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">Status</div>
              <Badge className={getStatusColor(user.status)}>{user.status || 'ACTIVE'}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" onClick={handleEditClick}>
          Edit Profile
        </Button>
        <Button onClick={handleManagePermissions}>
          Manage Permissions
        </Button>
      </div>
    </div>
  )
})

OverviewTab.displayName = 'OverviewTab'
