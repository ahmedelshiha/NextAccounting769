'use client'

import React, { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mail, Phone, Building, MapPin, Calendar, Clock, Shield, Zap,
  CheckCircle2, AlertCircle, Eye, Lock, UserCheck
} from 'lucide-react'
import { UserItem } from '../../contexts/UsersContextProvider'
import { useUsersContext } from '../../contexts/UsersContextProvider'

interface OverviewTabProps {
  user: UserItem
}

const formatDate = (iso?: string) => {
  if (!iso) return 'Never'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Invalid date'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatTime = (iso?: string) => {
  if (!iso) return 'Never'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Invalid date'
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const daysSince = (iso?: string) => {
  if (!iso) return 0
  const start = new Date(iso).getTime()
  if (Number.isNaN(start)) return 0
  const now = Date.now()
  return Math.max(0, Math.floor((now - start) / (24 * 60 * 60 * 1000)))
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

  const isActive = user.status === 'ACTIVE'
  const daysSinceCreation = daysSince(user.createdAt)
  const lastActiveInfo = user.lastLoginAt
    ? `${daysSince(user.lastLoginAt)} days ago`
    : 'Never logged in'

  return (
    <div className="space-y-8">
      {/* Key Metrics Cards */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Status</p>
                <p className="text-2xl font-bold text-blue-900">{user.status || 'ACTIVE'}</p>
              </div>
              {isActive ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Member Since</p>
                <p className="text-2xl font-bold text-green-900">{daysSinceCreation}</p>
                <p className="text-xs text-green-700 mt-1">days active</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Last Activity</p>
                <p className="text-sm font-bold text-purple-900">{lastActiveInfo}</p>
                {user.lastLoginAt && (
                  <p className="text-xs text-purple-700 mt-1">{formatTime(user.lastLoginAt)}</p>
                )}
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </section>

      {/* Personal Information */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-slate-200">
            {/* Name */}
            <div className="px-6 py-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3 flex-1">
                <UserCheck className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Full Name</p>
                  <p className="text-base text-slate-600 mt-1">{user.name || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="px-6 py-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3 flex-1">
                <Mail className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Email Address</p>
                  <p className="text-base text-slate-600 mt-1">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Phone */}
            {user.phone && (
              <div className="px-6 py-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <Phone className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Phone Number</p>
                    <p className="text-base text-slate-600 mt-1">{user.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Company */}
            {user.company && (
              <div className="px-6 py-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <Building className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Company</p>
                    <p className="text-base text-slate-600 mt-1">{user.company}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            {user.location && (
              <div className="px-6 py-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <MapPin className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Location</p>
                    <p className="text-base text-slate-600 mt-1">{user.location}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Access & Security */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Access & Security</h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-slate-200">
            {/* Role */}
            <div className="px-6 py-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3 flex-1">
                <Shield className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Role</p>
                  <div className="mt-2">
                    <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                      {user.role || 'VIEWER'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="px-6 py-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3 flex-1">
                <Zap className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Account Status</p>
                  <div className="mt-2">
                    <Badge className={`${
                      isActive
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Created */}
            <div className="px-6 py-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3 flex-1">
                <Calendar className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Account Created</p>
                  <p className="text-base text-slate-600 mt-1">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Last Login */}
            <div className="px-6 py-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3 flex-1">
                <Eye className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Last Login</p>
                  <p className="text-base text-slate-600 mt-1">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Password Status */}
            <div className="px-6 py-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3 flex-1">
                <Lock className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Password Status</p>
                  <Badge className="mt-2 bg-yellow-100 text-yellow-800 border border-yellow-200">
                    Set
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="border-t border-slate-200 pt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleEditClick}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Edit Profile
          </Button>
          <Button
            onClick={handleManagePermissions}
            variant="outline"
          >
            Manage Permissions
          </Button>
          <Button
            onClick={() => alert('Reset password functionality coming soon')}
            variant="outline"
          >
            Reset Password
          </Button>
        </div>
      </section>
    </div>
  )
})

OverviewTab.displayName = 'OverviewTab'
