'use client'

import type { Column, RowAction } from '@/types/dashboard'
import { useMemo, useState, useCallback } from 'react'
import { ChevronDown, ChevronUp, List, Grid3x3 } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Button } from '@/components/ui/button'
import { VirtualScroller } from '@/lib/virtual-scroller'

/**
 * Virtualized Data Table - Enhanced DataTable for large datasets (100+ rows)
 * 
 * Performance improvements:
 * - Only renders visible rows (O(1) DOM nodes instead of O(n))
 * - Handles 1000+ rows smoothly at 60 FPS
 * - Maintains fixed header while body scrolls
 * - Preserves all DataTable features (sorting, selection, actions)
 * - Automatically activates for datasets > VIRTUALIZATION_THRESHOLD
 * 
 * Props are identical to DataTable, so it's a drop-in replacement
 * when useVirtualization prop is true or rows.length > threshold
 */

interface VirtualizedDataTableProps<T extends { id?: string | number }> {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (key: string) => void
  actions?: RowAction<T>[]
  selectable?: boolean
  onSelectionChange?: (ids: Array<string | number>) => void
  useVirtualization?: boolean
  virtualizationThreshold?: number
  maxHeight?: string | number
}

const VIRTUALIZATION_THRESHOLD = 100
const ROW_HEIGHT = 72 // py-4 padding + text = ~72px
const MAX_HEIGHT = 'calc(100vh - 400px)' // Leave room for header + footer

/**
 * Data Table Row Component - Used by both regular and virtualized tables
 */
function DataTableRow<T extends { id?: string | number }>({
  row,
  columns,
  actions,
  selectable,
  selected,
  onToggleSelect,
  sortBy,
  sortOrder,
  onSort,
  idx
}: {
  row: T
  columns: Column<T>[]
  actions: RowAction<T>[]
  selectable: boolean
  selected: Set<string | number>
  onToggleSelect: (id?: string | number) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (key: string) => void
  idx: number
}) {
  return (
    <tr key={row.id ?? idx} className="hover:bg-gray-50 border-b border-gray-200">
      {selectable && (
        <td className="px-4 py-4">
          <input
            type="checkbox"
            checked={row.id != null && selected.has(row.id)}
            onChange={() => onToggleSelect(row.id)}
            aria-label={`Select row ${idx + 1}`}
          />
        </td>
      )}
      {columns.map((c) => (
        <td
          key={String(c.key)}
          className={`px-6 py-4 whitespace-nowrap text-sm ${
            c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'
          }`}
        >
          {c.render ? c.render((row as any)[c.key as any], row) : (row as any)[c.key as any]}
        </td>
      ))}
      {actions.length > 0 && (
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
          <div className="flex items-center justify-end gap-2">
            {actions.map((a, i) => {
              const isDisabled = typeof a.disabled === 'function' ? a.disabled(row) : !!a.disabled
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (!isDisabled) a.onClick(row)
                  }}
                  disabled={isDisabled}
                  aria-disabled={isDisabled}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                    a.variant === 'destructive' ? 'text-red-600 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-100'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {a.label}
                </button>
              )
            })}
          </div>
        </td>
      )}
    </tr>
  )
}

/**
 * Mobile Card View - Used for responsive design on small screens
 */
function MobileCardView<T extends { id?: string | number }>({
  rows,
  columns,
  actions,
  selected,
  onToggleSelect
}: {
  rows: T[]
  columns: Column<T>[]
  actions: RowAction<T>[]
  selected: Set<string | number>
  onToggleSelect: (id?: string | number) => void
}) {
  return (
    <div className="space-y-3">
      {rows.map((row, idx) => (
        <div key={row.id ?? idx} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="space-y-3">
            {columns.map((col) => (
              <div key={String(col.key)} className="flex justify-between items-start gap-2">
                <span className="text-xs font-semibold text-gray-600 uppercase">{col.label}</span>
                <div className="text-sm text-gray-900 text-right">
                  {col.render ? col.render((row as any)[col.key as any], row) : (row as any)[col.key as any]}
                </div>
              </div>
            ))}
            {actions.length > 0 && (
              <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                {actions.map((a, i) => {
                  const isDisabled = typeof a.disabled === 'function' ? a.disabled(row) : !!a.disabled
                  return (
                    <button
                      key={i}
                      onClick={() => (a.handler || a.onClick)(row)}
                      disabled={isDisabled}
                      className="flex-1 text-xs py-2 px-3 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {a.icon && <span className="mr-1">{a.icon}</span>}
                      {a.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Main VirtualizedDataTable Component
 */
export default function VirtualizedDataTable<T extends { id?: string | number }>({
  columns,
  rows,
  loading,
  sortBy,
  sortOrder = 'asc',
  onSort,
  actions = [],
  selectable = false,
  onSelectionChange,
  useVirtualization,
  virtualizationThreshold = VIRTUALIZATION_THRESHOLD,
  maxHeight = MAX_HEIGHT
}: VirtualizedDataTableProps<T>) {
  const { t } = useTranslations()
  const [selected, setSelected] = useState<Set<string | number>>(new Set())
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Auto-switch to card view on mobile or use virtualization for large datasets
  const currentViewMode = isMobile ? 'cards' : viewMode
  const shouldVirtualize = useVirtualization || rows.length > virtualizationThreshold

  const allSelected = useMemo(() => rows.length > 0 && selected.size === rows.length, [rows.length, selected])

  const toggleAll = useCallback(() => {
    const next = allSelected ? new Set<string | number>() : new Set(rows.map((r) => r.id!).filter(Boolean))
    setSelected(next)
    onSelectionChange?.(Array.from(next))
  }, [allSelected, rows, onSelectionChange])

  const toggleOne = useCallback(
    (id?: string | number) => {
      if (id == null) return
      const next = new Set(selected)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      setSelected(next)
      onSelectionChange?.(Array.from(next))
    },
    [selected, onSelectionChange]
  )

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse">
          {isMobile ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border-b border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="h-12 bg-gray-100 rounded-t-lg" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-50 border-t border-gray-100" />
              ))}
            </>
          )}
        </div>
      </div>
    )
  }

  // Empty state
  if (!rows.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 md:p-12 text-center text-gray-600">
        <p className="text-sm md:text-base">{t('dashboard.noData')}</p>
      </div>
    )
  }

  // Mobile card view
  if (currentViewMode === 'cards') {
    return (
      <MobileCardView rows={rows} columns={columns} actions={actions} selected={selected} onToggleSelect={toggleOne} />
    )
  }

  // Desktop table view with or without virtualization
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
      {/* View mode toggle */}
      {!isMobile && actions.length > 0 && (
        <div className="flex justify-end p-3 border-b border-gray-200">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              Table
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="gap-2"
            >
              <Grid3x3 className="w-4 h-4" />
              Cards
            </Button>
          </div>
        </div>
      )}

      {/* Table with virtualization */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          {/* Fixed header */}
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {selectable && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {c.sortable && onSort ? (
                    <button onClick={() => onSort(String(c.key))} className="flex items-center gap-1 hover:text-gray-700">
                      <span>{c.label}</span>
                      {sortBy === c.key &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        ))}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard.actions')}
                </th>
              )}
            </tr>
          </thead>
        </table>

        {/* Virtualized or standard tbody */}
        {shouldVirtualize ? (
          <VirtualScroller
            items={rows}
            itemHeight={ROW_HEIGHT}
            maxHeight={maxHeight}
            renderItem={(row, idx) => (
              <table className="min-w-full table-fixed" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <DataTableRow
                    row={row}
                    columns={columns}
                    actions={actions}
                    selectable={selectable}
                    selected={selected}
                    onToggleSelect={toggleOne}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSort}
                    idx={idx}
                  />
                </tbody>
              </table>
            )}
            getKey={(row) => row.id ?? Math.random()}
            className="flex-1"
            overscan={10}
          />
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight }}>
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white">
                {rows.map((row, idx) => (
                  <DataTableRow
                    key={row.id ?? idx}
                    row={row}
                    columns={columns}
                    actions={actions}
                    selectable={selectable}
                    selected={selected}
                    onToggleSelect={toggleOne}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSort}
                    idx={idx}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selection summary footer */}
      {selectable && selected.size > 0 && (
        <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-700">
          {t('dashboard.selectedCount', { count: selected.size })}
        </div>
      )}
    </div>
  )
}
