'use client'

import { useState, useEffect } from 'react'
import { usePresetSharing, PermissionLevel } from '../hooks/usePresetSharing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Trash2, Copy, Check } from 'lucide-react'

interface PresetSharingDialogProps {
  presetId: string
  presetName: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onShareSuccess?: () => void
}

export function PresetSharingDialog({
  presetId,
  presetName,
  isOpen,
  onOpenChange,
  onShareSuccess
}: PresetSharingDialogProps) {
  const { shares, isLoading, error, fetchShares, sharePreset, updateSharePermissions, revokeShare, canEdit } =
    usePresetSharing()
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<PermissionLevel>('viewer')
  const [isSharing, setIsSharing] = useState(false)
  const [copyState, setCopyState] = useState<string | null>(null)

  // Load shares when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchShares(presetId)
    }
  }, [isOpen, presetId, fetchShares])

  const handleShare = async () => {
    if (!email.trim()) {
      return
    }

    setIsSharing(true)
    try {
      await sharePreset(presetId, email, permission)
      setEmail('')
      setPermission('viewer')
      onShareSuccess?.()
    } catch (err) {
      // Error is already in the state
    } finally {
      setIsSharing(false)
    }
  }

  const handleUpdatePermission = async (shareId: string, newPermission: PermissionLevel) => {
    try {
      await updateSharePermissions(presetId, shareId, newPermission)
    } catch (err) {
      // Error is already in the state
    }
  }

  const handleRevoke = async (shareId: string) => {
    if (confirm('Are you sure you want to revoke access to this preset?')) {
      try {
        await revokeShare(presetId, shareId)
      } catch (err) {
        // Error is already in the state
      }
    }
  }

  const handleCopyShareLink = async (shareId: string) => {
    const shareLink = `${window.location.origin}/admin/users/presets/shared/${shareId}`
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopyState(shareId)
      setTimeout(() => setCopyState(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Preset: {presetName}</DialogTitle>
          <DialogDescription>Manage who has access to this filter preset and their permissions.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Form */}
          <div className="space-y-3 border-b pb-4">
            <h3 className="font-semibold text-sm">Add Access</h3>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isSharing}
                className="flex-1"
              />
              <Select value={permission} onValueChange={value => setPermission(value as PermissionLevel)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleShare} disabled={isSharing || !email.trim()} className="px-6">
                {isSharing ? 'Sharing...' : 'Share'}
              </Button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {/* Shares List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Current Access ({shares.length})</h3>

            {isLoading ? (
              <p className="text-sm text-gray-500">Loading shares...</p>
            ) : shares.length === 0 ? (
              <p className="text-sm text-gray-500">No one has access yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {shares.map(share => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {share.sharedWithUser?.name || share.sharedWithUser?.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{share.sharedWithUser?.email}</p>
                      {share.expiresAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expires: {new Date(share.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-2">
                      <Select
                        value={share.permissionLevel}
                        onValueChange={value => handleUpdatePermission(share.id, value as PermissionLevel)}
                        disabled={!canEdit(share.permissionLevel)}
                      >
                        <SelectTrigger className="w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyShareLink(share.id)}
                        title="Copy share link"
                        className="p-1 h-auto"
                      >
                        {copyState === share.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(share.id)}
                        className="p-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Permission Legend */}
          <div className="space-y-2 text-xs text-gray-600 bg-blue-50 p-3 rounded">
            <p className="font-semibold">Permission Levels:</p>
            <ul className="space-y-1 ml-2">
              <li>
                <strong>Viewer:</strong> Can see and use the preset, but cannot edit or share
              </li>
              <li>
                <strong>Editor:</strong> Can view, use, and edit the preset, but cannot share
              </li>
              <li>
                <strong>Admin:</strong> Full control - can view, use, edit, share, and revoke access
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
