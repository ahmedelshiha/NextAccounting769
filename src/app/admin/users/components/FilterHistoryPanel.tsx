import React, { useMemo, useState } from 'react'
import { X, RotateCcw, Download, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { FilterState } from '../hooks/useFilterState'
import type { FilterHistoryEntry } from '../hooks/useFilterHistory'

export interface FilterHistoryPanelProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  history: FilterHistoryEntry[]
  onReapply: (filters: FilterState) => void
  onClearHistory: () => void
  onExportHistory: () => void
  helpers: {
    relativeTime: (iso: string) => string
    describeFilters: (filters: FilterState) => string
  }
}

export function FilterHistoryPanel({
  isOpen,
  onOpenChange,
  history,
  onReapply,
  onClearHistory,
  onExportHistory,
  helpers
}: FilterHistoryPanelProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return history
    return history.filter(h => helpers.describeFilters(h.filters).toLowerCase().includes(q))
  }, [history, query, helpers])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={() => onOpenChange(false)}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-lg overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Filter History</h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close filter history"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-gray-100 flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search history..."
            className="text-sm flex-1"
            aria-label="Search filter history"
          />
          <Button variant="outline" size="sm" onClick={onExportHistory} aria-label="Export filter history">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={onClearHistory} aria-label="Clear filter history">
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>

        {/* List */}
        <div className="p-4 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-500">No history yet</div>
          )}
          {filtered.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onReapply(entry.filters)}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {helpers.describeFilters(entry.filters) || 'All users'}
                  </div>
                  <div className="text-xs text-gray-500">{helpers.relativeTime(entry.timestamp)}</div>
                </div>
                <div className="flex-shrink-0 text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Reapply</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
