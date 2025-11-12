import React, { useState, useMemo } from 'react'
import useSWR from 'swr'
import FilterBar from '@/components/dashboard/FilterBar'
import AdvancedDataTable from '@/components/dashboard/tables/AdvancedDataTable'
import type { Column, FilterConfig } from '@/types/dashboard'
import { apiFetch } from '@/lib/api'
import { useTranslations } from '@/lib/i18n'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface TaskRow {
  id: string | number
  title?: string | null
  assignee?: { id?: string; name?: string | null; email?: string | null } | null
  status?: string | null
  dueAt?: string | Date | null
}

const fetcher = async (url: string) => {
  const res = await apiFetch(url)
  if (!res.ok) return { tasks: [] }
  try {
    const json = await res.json()
    if (Array.isArray(json)) return { tasks: json }
    if (json && Array.isArray(json.tasks)) return { tasks: json.tasks }
    if (json && Array.isArray(json.items)) return { tasks: json.items }
    return { tasks: [] }
  } catch {
    return { tasks: [] }
  }
}

function buildQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v) })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export default function TasksList() {
  const { t } = useTranslations()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<{ status?: string; assigneeId?: string; range?: string }>({})
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([])
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null)

  const now = new Date()
  const dateFrom = useMemo(() => {
    if (filters.range === 'overdue') return undefined
    if (filters.range === '7d') { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString() }
    if (filters.range === '30d') { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString() }
    return undefined
  }, [filters.range])
  const dueBefore = useMemo(() => {
    if (filters.range === 'overdue') return new Date().toISOString()
    return undefined
  }, [filters.range])

  const query = buildQuery({ q: search || undefined, status: filters.status, assigneeId: filters.assigneeId, dateFrom, dueBefore })
  const { data, isLoading, mutate } = useSWR<{ tasks: TaskRow[] }>(`/api/admin/tasks${query}`, fetcher)
  const items = data?.tasks ?? []

  const onFilterChange = (key: string, value: string) => setFilters((p) => ({ ...p, [key]: value || undefined }))

  const active = useMemo(() => {
    const a: Array<{ key: string; label: string; value: string }> = []
    if (search) a.push({ key: 'q', label: t('common.search'), value: search })
    if (filters.status) a.push({ key: 'status', label: t('common.status'), value: filters.status })
    if (filters.assigneeId) a.push({ key: 'assigneeId', label: t('common.assignee'), value: filters.assigneeId })
    if (filters.range) a.push({ key: 'range', label: t('common.date'), value: filters.range === 'overdue' ? t('range.overdue') : (filters.range === '7d' ? t('range.last7d') : t('range.last30d')) })
    return a
  }, [search, filters, t])

  const filterConfigs: FilterConfig[] = useMemo(() => ([
    { key: 'status', label: t('common.status'), options: [
      { value: 'OPEN', label: t('tasks.status.open') },
      { value: 'IN_PROGRESS', label: t('tasks.status.in_progress') },
      { value: 'BLOCKED', label: t('tasks.status.blocked') },
      { value: 'COMPLETED', label: t('tasks.status.completed') },
      { value: 'CANCELLED', label: t('tasks.status.cancelled') },
    ], value: filters.status },
    { key: 'range', label: t('common.date'), options: [
      { value: 'overdue', label: t('range.overdue') },
      { value: '7d', label: t('range.last7d') },
      { value: '30d', label: t('range.last30d') },
    ], value: filters.range },
  ]), [filters.status, filters.range, t])

  const columns: Column<TaskRow>[] = useMemo(() => ([
    { key: 'id', label: t('common.id'), render: (v) => <span className="text-xs text-gray-500">{String(v).slice(0,6)}</span> },
    { key: 'title', label: t('common.title'), sortable: true },
    { key: 'assignee', label: t('common.assignee'), render: (v) => (
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{v?.name || '—'}</span>
        <span className="text-xs text-gray-500">{v?.email || ''}</span>
      </div>
    ) },
    { key: 'status', label: t('common.status'), sortable: true },
    { key: 'dueAt', label: t('common.due'), sortable: true, render: (v) => v ? new Date(v as any).toLocaleString() : '—' },
  ]), [t])

  const exportCsv = async () => {
    const qs = new URLSearchParams()
    if (search) qs.set('q', search)
    if (filters.status) qs.set('status', filters.status)
    if (filters.assigneeId) qs.set('assigneeId', filters.assigneeId)
    if (filters.range === 'overdue') qs.set('dueBefore', new Date().toISOString())
    if (filters.range === '7d') qs.set('dateFrom', new Date(Date.now() - 7*24*60*60*1000).toISOString())
    if (filters.range === '30d') qs.set('dateFrom', new Date(Date.now() - 30*24*60*60*1000).toISOString())
    const res = await apiFetch(`/api/admin/tasks/export?${qs.toString()}`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const setStatusBulk = async () => {
    if (!selectedIds.length) return
    setSelectedBulkStatus(null)
    setIsStatusModalOpen(true)
  }

  const applyStatusBulk = async () => {
    if (!selectedIds.length || !selectedBulkStatus) return
    const next = selectedBulkStatus.toUpperCase()
    if (!['OPEN','IN_PROGRESS','BLOCKED','COMPLETED','CANCELLED'].includes(next)) return
    await apiFetch('/api/admin/tasks/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status', taskIds: selectedIds, status: next }) })
    setSelectedIds([])
    setIsStatusModalOpen(false)
    await mutate()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.tasks.title')}</h2>
      </div>

      <div aria-live="polite" className="sr-only">
        {selectedIds.length > 0 ? t('dashboard.selectedCount', { count: selectedIds.length }) : t('dashboard.noSelection')}
        {active.length ? ` • ${t('dashboard.filtersActiveCount', { count: active.length })}` : ''}
      </div>

      <FilterBar
        filters={filterConfigs}
        onFilterChange={onFilterChange}
        onSearch={(v) => setSearch(v)}
        active={active}
        searchPlaceholder={t('dashboard.search.tasks')}
      />

      <AdvancedDataTable<TaskRow>
        columns={columns}
        rows={items}
        loading={isLoading}
        selectable
        onSelectionChange={(ids) => setSelectedIds(ids)}
      />

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-sm text-gray-700">{t('dashboard.selectedCount', { count: selectedIds.length })}</div>
          <div className="flex items-center gap-2">
            <button onClick={setStatusBulk} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">{t('dashboard.setStatus')}</button>
            <button onClick={exportCsv} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">{t('dashboard.exportCsv')}</button>
            <button onClick={() => setSelectedIds([])} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50">{t('dashboard.clear')}</button>
          </div>
        </div>
      )}

      {/* Status modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dashboard.setStatus')}</DialogTitle>
            <DialogDescription>{t('dashboard.setStatusConfirm', { count: selectedIds.length })}</DialogDescription>
          </DialogHeader>

          <div className="p-4">
            <Select value={selectedBulkStatus || undefined} onValueChange={(v) => setSelectedBulkStatus(v || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('common.selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={applyStatusBulk} disabled={!selectedBulkStatus}>{t('common.apply')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
