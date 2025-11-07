'use client'

import React, { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Loader2 } from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'
import { UserItem } from '../contexts/UsersContextProvider'

interface UserActionsProps {
  user: UserItem
  onViewProfile: (user: UserItem) => void
  isLoading?: boolean
}

export const UserActions = memo(function UserActions({
  user,
  onViewProfile,
  isLoading = false
}: UserActionsProps) {
  const perms = usePermissions()

  const handleViewProfile = useCallback(() => {
    onViewProfile(user)
  }, [user, onViewProfile])

  if (!perms.canManageUsers) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleViewProfile}
        disabled={isLoading}
        className="flex items-center gap-1"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        <span className="hidden sm:inline">View</span>
      </Button>
    </div>
  )
})

UserActions.displayName = 'UserActions'
