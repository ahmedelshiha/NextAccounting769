'use client'

import { useState, useCallback } from 'react'

export type PermissionLevel = 'viewer' | 'editor' | 'admin'

export interface PresetShareRecipient {
  id: string
  email: string
  name: string
}

export interface PresetShare {
  id: string
  presetId: string
  ownerId: string
  sharedWithUserId?: string
  sharedWithUser?: PresetShareRecipient
  permissionLevel: PermissionLevel
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface UsePresetSharingResult {
  shares: PresetShare[]
  isLoading: boolean
  error: string | null
  fetchShares: (presetId: string) => Promise<void>
  sharePreset: (presetId: string, sharedWithUserId: string, permissionLevel: PermissionLevel, expiresAt?: string) => Promise<PresetShare>
  updateSharePermissions: (presetId: string, shareId: string, permissionLevel: PermissionLevel) => Promise<PresetShare>
  revokeShare: (presetId: string, shareId: string) => Promise<void>
  canShare: (permissionLevel: PermissionLevel) => boolean
  canEdit: (permissionLevel: PermissionLevel) => boolean
}

/**
 * Hook to manage preset sharing and permissions
 */
export function usePresetSharing(): UsePresetSharingResult {
  const [shares, setShares] = useState<PresetShare[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all shares for a preset
  const fetchShares = useCallback(async (presetId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/presets/${presetId}/share`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch shares: ${response.statusText}`)
      }

      const data = await response.json()
      setShares(data.shares || [])
    } catch (err) {
      const message = (err as Error).message
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Share preset with a user
  const sharePreset = useCallback(
    async (
      presetId: string,
      sharedWithUserId: string,
      permissionLevel: PermissionLevel,
      expiresAt?: string
    ): Promise<PresetShare> => {
      setError(null)

      try {
        const response = await fetch(`/api/admin/users/presets/${presetId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sharedWithUserId,
            permissionLevel,
            expiresAt
          })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to share preset')
        }

        const share = await response.json()
        setShares(prev => [share, ...prev])

        return share
      } catch (err) {
        const message = (err as Error).message
        setError(message)
        throw err
      }
    },
    []
  )

  // Update share permissions
  const updateSharePermissions = useCallback(
    async (presetId: string, shareId: string, permissionLevel: PermissionLevel): Promise<PresetShare> => {
      setError(null)

      try {
        const response = await fetch(`/api/admin/users/presets/${presetId}/share/${shareId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissionLevel })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update permissions')
        }

        const updated = await response.json()
        setShares(prev => prev.map(s => (s.id === shareId ? updated : s)))

        return updated
      } catch (err) {
        const message = (err as Error).message
        setError(message)
        throw err
      }
    },
    []
  )

  // Revoke share access
  const revokeShare = useCallback(async (presetId: string, shareId: string) => {
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/presets/${presetId}/share/${shareId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to revoke access')
      }

      setShares(prev => prev.filter(s => s.id !== shareId))
    } catch (err) {
      const message = (err as Error).message
      setError(message)
      throw err
    }
  }, [])

  // Check if user can share with others
  const canShare = useCallback((permissionLevel: PermissionLevel): boolean => {
    return permissionLevel === 'admin'
  }, [])

  // Check if user can edit preset
  const canEdit = useCallback((permissionLevel: PermissionLevel): boolean => {
    return permissionLevel === 'editor' || permissionLevel === 'admin'
  }, [])

  return {
    shares,
    isLoading,
    error,
    fetchShares,
    sharePreset,
    updateSharePermissions,
    revokeShare,
    canShare,
    canEdit
  }
}
