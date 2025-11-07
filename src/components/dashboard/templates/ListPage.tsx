"use client"

import StandardPage from "./StandardPage"
import DataTable from "@/components/dashboard/DataTable"
import VirtualizedDataTable from "@/components/dashboard/VirtualizedDataTable"
import AdvancedDataTable from "@/components/dashboard/tables/AdvancedDataTable"
import type { ActionItem, Column, FilterConfig, RowAction, TabItem } from "@/types/dashboard"
import { ReactNode, useMemo, useState } from "react"

/**
 * Props for ListPage, a composition of StandardPage and a table component.
 * Supports DataTable (basic), VirtualizedDataTable (large datasets), and AdvancedDataTable (pagination).
 */
interface ListPageProps<T extends { id?: string | number }> {
  title: string
  subtitle?: string
  primaryAction?: ActionItem
  secondaryActions?: ActionItem[]
  primaryTabs?: TabItem[]
  activePrimaryTab?: string
  onPrimaryTabChange?: (key: string) => void
  secondaryTabs?: TabItem[]
  activeSecondaryTab?: string
  onSecondaryTabChange?: (key: string) => void
  filters?: FilterConfig[]
  onFilterChange?: (key: string, value: string) => void
  onSearch?: (value: string) => void
  searchPlaceholder?: string
  /** Column definitions for rendering rows */
  columns: Column<T>[]
  /** Row data for the table */
  rows: T[]
  loading?: boolean
  sortBy?: string
  sortOrder?: "asc" | "desc"
  onSort?: (key: string) => void
  actions?: RowAction<T>[]
  selectable?: boolean
  /** Optional render prop to show custom bulk actions when selection is non-empty */
  renderBulkActions?: (selectedIds: Array<string | number>) => ReactNode
  /** Use AdvancedDataTable (adds sticky header + pagination UI) */
  useAdvancedTable?: boolean
  /** Use VirtualizedDataTable for large datasets (100+ rows). Default: true */
  useVirtualization?: boolean
  /** Virtualization threshold - enable virtual scrolling when rows exceed this count. Default: 100 */
  virtualizationThreshold?: number
  /** Current page (1-based). If omitted, internal pagination state is used. */
  page?: number
  /** Page size for pagination (AdvancedDataTable only). Defaults to 20. */
  pageSize?: number
  /** Total rows when using server-side pagination. If omitted, client-side pagination is used. */
  total?: number
  /** Page change handler (AdvancedDataTable only) */
  onPageChange?: (page: number) => void
  /** Message shown when there are no rows */
  emptyMessage?: string
}

/**
 * ListPage composes StandardPage with a table to create reusable list views.
 * It supports selection, sorting, filters, search and custom bulk actions.
 */
export default function ListPage<T extends { id?: string | number }>(props: ListPageProps<T>) {
  const {
    title,
    subtitle,
    primaryAction,
    secondaryActions,
    primaryTabs,
    activePrimaryTab,
    onPrimaryTabChange,
    secondaryTabs,
    activeSecondaryTab,
    onSecondaryTabChange,
    filters,
    onFilterChange,
    onSearch,
    searchPlaceholder,
    columns,
    rows,
    loading,
    sortBy,
    sortOrder,
    onSort,
    actions,
    selectable = true,
    renderBulkActions,
    useAdvancedTable = false,
    useVirtualization = true,
    virtualizationThreshold = 100,
    page,
    pageSize,
    total,
    onPageChange,
    emptyMessage,
  } = props

  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([])
  const activeFilters = useMemo(() => (filters || []).filter((f) => f.value).map((f) => ({ key: f.key, label: f.label, value: String(f.value) })), [filters])

  // Determine which table component to use
  // Priority: AdvancedDataTable > VirtualizedDataTable > DataTable
  const useVirtualizationProp = useVirtualization !== false // Default to true

  return (
    <StandardPage
      title={title}
      subtitle={subtitle}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      primaryTabs={primaryTabs}
      activePrimaryTab={activePrimaryTab}
      onPrimaryTabChange={onPrimaryTabChange}
      secondaryTabs={secondaryTabs}
      activeSecondaryTab={activeSecondaryTab}
      onSecondaryTabChange={onSecondaryTabChange}
      filters={filters}
      activeFilters={activeFilters}
      onFilterChange={onFilterChange}
      onSearch={onSearch}
      searchPlaceholder={searchPlaceholder}
      loading={loading}
    >
      {renderBulkActions && selectedIds.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">{renderBulkActions(selectedIds)}</div>
      )}

      {useAdvancedTable ? (
        <AdvancedDataTable<T>
          columns={columns}
          rows={rows}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          actions={actions}
          selectable={selectable}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          emptyMessage={emptyMessage}
          onSelectionChange={setSelectedIds}
        />
      ) : useVirtualizationProp ? (
        <VirtualizedDataTable<T>
          columns={columns}
          rows={rows}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          actions={actions}
          selectable={selectable}
          onSelectionChange={setSelectedIds}
          useVirtualization={true}
          virtualizationThreshold={virtualizationThreshold ?? 100}
        />
      ) : (
        <DataTable<T>
          columns={columns}
          rows={rows}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          actions={actions}
          selectable={selectable}
          onSelectionChange={setSelectedIds}
        />
      )}
    </StandardPage>
  )
}
