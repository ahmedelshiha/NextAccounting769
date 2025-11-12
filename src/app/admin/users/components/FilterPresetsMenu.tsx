'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Star, Trash2, Plus, Edit2, X } from 'lucide-react'
import { FilterPreset } from '../hooks/useFilterPresets'
import { FilterState } from '../hooks/useFilterState'

export interface FilterPresetsMenuProps {
  presets: FilterPreset[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onLoadPreset: (preset: FilterPreset) => void
  onCreatePreset: (name: string, filters: FilterState, description?: string) => void
  onDeletePreset: (id: string) => void
  onTogglePin: (id: string) => void
  currentFilters: FilterState
}

export function FilterPresetsMenu({
  presets,
  isOpen,
  onOpenChange,
  onLoadPreset,
  onCreatePreset,
  onDeletePreset,
  onTogglePin,
  currentFilters
}: FilterPresetsMenuProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetDescription, setNewPresetDescription] = useState('')

  const handleCreatePreset = () => {
    if (!newPresetName.trim()) {
      return
    }

    try {
      onCreatePreset(newPresetName, currentFilters, newPresetDescription || undefined)
      setNewPresetName('')
      setNewPresetDescription('')
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to create preset:', error)
    }
  }

  const pinnedPresets = presets.filter(p => p.isPinned)
  const unpinnedPresets = presets.filter(p => !p.isPinned)

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={() => onOpenChange(false)}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-lg overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Filter Presets</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close presets menu"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Create New Preset Section */}
          {isCreating ? (
            <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 space-y-2">
              <Input
                placeholder="Preset name"
                value={newPresetName}
                onChange={e => setNewPresetName(e.target.value)}
                className="text-sm"
                autoFocus
              />
              <Input
                placeholder="Description (optional)"
                value={newPresetDescription}
                onChange={e => setNewPresetDescription(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreatePreset}
                  disabled={!newPresetName.trim()}
                  size="sm"
                  variant="default"
                  className="flex-1"
                >
                  Save Preset
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false)
                    setNewPresetName('')
                    setNewPresetDescription('')
                  }}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsCreating(true)}
              size="sm"
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Save Current Filters
            </Button>
          )}

          {/* Pinned Presets */}
          {pinnedPresets.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Pinned
              </h3>
              {pinnedPresets.map(preset => (
                <PresetItem
                  key={preset.id}
                  preset={preset}
                  onLoad={onLoadPreset}
                  onDelete={onDeletePreset}
                  onTogglePin={onTogglePin}
                />
              ))}
            </div>
          )}

          {/* All Presets */}
          {unpinnedPresets.length > 0 && (
            <div className="space-y-2">
              {pinnedPresets.length > 0 && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4">
                  All Presets
                </h3>
              )}
              {unpinnedPresets.map(preset => (
                <PresetItem
                  key={preset.id}
                  preset={preset}
                  onLoad={onLoadPreset}
                  onDelete={onDeletePreset}
                  onTogglePin={onTogglePin}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {presets.length === 0 && !isCreating && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No presets yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Save your current filters as a preset to use later
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface PresetItemProps {
  preset: FilterPreset
  onLoad: (preset: FilterPreset) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
}

function PresetItem({
  preset,
  onLoad,
  onDelete,
  onTogglePin
}: PresetItemProps) {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <div
      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={() => onLoad(preset)}
          className="flex-1 text-left"
          type="button"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {preset.name}
              </h4>
              {preset.description && (
                <p className="text-xs text-gray-500 truncate">
                  {preset.description}
                </p>
              )}
            </div>
          </div>
        </button>

        {isHovering && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => onTogglePin(preset.id)}
              className={`p-1.5 rounded transition-colors ${
                preset.isPinned
                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                  : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-100'
              }`}
              title={preset.isPinned ? 'Unpin preset' : 'Pin preset'}
              aria-label={preset.isPinned ? 'Unpin preset' : 'Pin preset'}
              type="button"
            >
              <Star className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(preset.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
              title="Delete preset"
              aria-label="Delete preset"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400 mt-1">
        Updated {formatDate(preset.updatedAt)}
      </div>
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}
