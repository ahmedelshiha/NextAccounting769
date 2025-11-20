'use client'

import React, { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SharedComponentProps } from '../types'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  /** Unique key for the column */
  key: keyof T
  /** Display label */
  label: string
  /** Column width (CSS value) */
  width?: string
  /** Is sortable */
  sortable?: boolean
  /** Is filterable */
  filterable?: boolean
  /** Custom render function */
  render?: (value: any, row: T, rowIndex: number) => React.ReactNode
  /** Cell alignment */
  align?: 'left' | 'center' | 'right'
}

export interface SortState {
  key: string | null
  order: 'asc' | 'desc'
}

export interface PaginationState {
  page: number
  limit: number
}

interface SharedDataTableProps<T extends Record<string, any>> extends SharedComponentProps {
  /** Table data */
  data: T[]
  /** Column definitions */
  columns: Column<T>[]
  /** Current sort state */
  sort?: SortState
  /** Called when sort changes */
  onSort?: (sort: SortState) => void
  /** Current pagination state */
  pagination?: PaginationState
  /** Called when pagination changes */
  onPaginationChange?: (pagination: PaginationState) => void
  /** Total items (for pagination) */
  totalItems?: number
  /** Selection state */
  selectedIds?: string[]
  /** Called when selection changes */
  onSelectionChange?: (ids: string[]) => void
  /** Row actions */
  actions?: Array<{
    label: string
    onClick: (row: T) => void
    variant?: 'default' | 'outline' | 'destructive'
    disabled?: (row: T) => boolean
  }>
  /** Is loading */
  isLoading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Show row numbers */
  showRowNumbers?: boolean
  /** Show selection checkboxes */
  showSelection?: boolean
  /** ID field name for selection */
  idField?: keyof T
  /** Enable export to CSV */
  enableExport?: boolean
}

/**
 * SharedDataTable Component
 *
 * Unified data table component for displaying lists across portal and admin.
 * Features: sorting, pagination, selection, filtering, export, and custom rendering.
 *
 * @example
 * ```tsx
 * <SharedDataTable<Service>
 *   data={services}
 *   columns={[
 *     { key: 'name', label: 'Service Name', sortable: true },
 *     { key: 'price', label: 'Price', align: 'right' },
 *     {
 *       key: 'status',
 *       label: 'Status',
 *       render: (value) => <Badge>{value}</Badge>,
 *     },
 *   ]}
 *   sort={sort}
 *   onSort={setSort}
 *   pagination={pagination}
 *   onPaginationChange={setPagination}
 *   totalItems={totalServices}
 * />
 * ```
 */
export default function SharedDataTable<T extends Record<string, any>>({
  data,
  columns,
  sort,
  onSort,
  pagination = { page: 1, limit: 10 },
  onPaginationChange,
  totalItems = data.length,
  selectedIds = [],
  onSelectionChange,
  actions = [],
  isLoading = false,
  emptyMessage = 'No data available',
  showRowNumbers = false,
  showSelection = false,
  idField = 'id' as keyof T,
  enableExport = false,
  className,
}: SharedDataTableProps<T>) {
  const [sortState, setSortState] = useState<SortState>(sort || { key: null, order: 'asc' })

  const totalPages = Math.ceil(totalItems / pagination.limit)

  const handleSort = (key: string) => {
    const newSort: SortState = {
      key,
      order: sortState.key === key && sortState.order === 'asc' ? 'desc' : 'asc',
    }
    setSortState(newSort)
    onSort?.(newSort)
  }

  const handleSelectAll = () => {
    if (selectedIds.length === data.length) {
      onSelectionChange?.([])
    } else {
      onSelectionChange?.(data.map((row) => String(row[idField])))
    }
  }

  const handleSelectRow = (rowId: string) => {
    if (selectedIds.includes(rowId)) {
      onSelectionChange?.(selectedIds.filter((id) => id !== rowId))
    } else {
      onSelectionChange?.([...selectedIds, rowId])
    }
  }

  const handleExport = () => {
    // Create CSV content
    const headers = columns.map((col) => col.label).join(',')
    const rows = data
      .map((row) =>
        columns
          .map((col) => {
            const value = row[col.key]
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value
          })
          .join(',')
      )
      .join('\n')

    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'export.csv'
    a.click()
  }

  const handlePageChange = (newPage: number) => {
    onPaginationChange?.({
      ...pagination,
      page: newPage,
    })
  }

  const handleLimitChange = (newLimit: string) => {
    onPaginationChange?.({
      page: 1,
      limit: parseInt(newLimit),
    })
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, totalItems)} of {totalItems} items
        </div>
        {enableExport && (
          <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {showSelection && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {showRowNumbers && <TableHead className="w-12 text-right">#</TableHead>}
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  style={{ width: column.width }}
                  className={cn(
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center'
                  )}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(String(column.key))}
                      className="flex items-center gap-2 hover:text-foreground"
                    >
                      {column.label}
                      {sortState.key === String(column.key) && (
                        <span>{sortState.order === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
              {actions.length > 0 && <TableHead className="w-20">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (showSelection ? 1 : 0) + (showRowNumbers ? 1 : 0)}>
                  <div className="flex justify-center py-8">
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (showSelection ? 1 : 0) + (showRowNumbers ? 1 : 0)}>
                  <div className="flex justify-center py-8">
                    <span className="text-sm text-muted-foreground">{emptyMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => {
                const rowId = String(row[idField])
                const isSelected = selectedIds.includes(rowId)

                return (
                  <TableRow key={rowId} className={isSelected ? 'bg-muted/50' : ''}>
                    {showSelection && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectRow(rowId)}
                        />
                      </TableCell>
                    )}
                    {showRowNumbers && (
                      <TableCell className="text-right text-muted-foreground">
                        {(pagination.page - 1) * pagination.limit + rowIndex + 1}
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={String(column.key)}
                        className={cn(
                          column.align === 'right' && 'text-right',
                          column.align === 'center' && 'text-center'
                        )}
                      >
                        {column.render
                          ? column.render(row[column.key], row, rowIndex)
                          : row[column.key]}
                      </TableCell>
                    ))}
                    {actions.length > 0 && (
                      <TableCell>
                        <div className="flex gap-1">
                          {actions.map((action, idx) => (
                            <Button
                              key={idx}
                              size="sm"
                              variant={action.variant || 'outline'}
                              onClick={() => action.onClick(row)}
                              disabled={action.disabled?.(row)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select value={String(pagination.limit)} onValueChange={handleLimitChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm">
              Page {pagination.page} of {totalPages}
            </span>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(totalPages)}
              disabled={pagination.page === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
