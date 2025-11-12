import React, { useState, useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import FilterBar from '@/components/dashboard/FilterBar'
import AdvancedDataTable from '@/components/dashboard/tables/AdvancedDataTable'
import type { Column, FilterConfig } from '@/types/dashboard'
import { apiFetch } from '@/lib/api'
import { useTranslations } from '@/lib/i18n'
import { hasRole } from '@/lib/permissions'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface UserRow {
  id: string | number
  name?: string | null
  email?: string | null
  role?: string | null
  status?: string | null
  createdAt?: string | Date | null
}

const fetcher = async (url: string) => {
  const res = await apiFetch(url)
  if (!res.ok) return { users: [] }
  try {
    const json = await res.json()
    if (Array.isArray(json)) return { users: json }
    if (json && Array.isArray(json.users)) return { users: json.users }
    return { users: [] }
  } catch {
    return { users: [] }
  }
}

function buildQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v) })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export default function ClientsList() {
  const { t } = useTranslations()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<{ role?: string; status?: string; range?: string }>({})
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([])
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [selectedBulkRole, setSelectedBulkRole] = useState<string | null>(null)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<string | null>(null)

  // Translate date range to dateFrom/dateTo
  const now = new Date()
  const dateFrom = useMemo(() => {
    if (filters.range === '7d') { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString() }
    if (filters.range === '30d') { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString() }
    return undefined
  }, [filters.range])

  const query = buildQuery({ q: search || undefined, role: filters.role, status: filters.status, dateFrom })
  const { data, isLoading, mutate } = useSWR<{ users: UserRow[] }>(`/api/admin/users${query}`, fetcher)
  const items = data?.users ?? []

  const onFilterChange = (key: string, value: string) => setFilters((p) => ({ ...p, [key]: value || undefined }))

  const active = useMemo(() => {
    const a: Array<{ key: string; label: string; value: string }> = []
    if (search) a.push({ key: 'q', label: t('common.search'), value: search })
    if (filters.role) a.push({ key: 'role', label: t('common.role'), value: filters.role })
    if (filters.status) a.push({ key: 'status', label: t('common.status'), value: filters.status })
    if (filters.range) a.push({ key: 'range', label: t('common.date'), value: filters.range === '7d' ? t('range.last7d') : t('range.last30d') })
    return a
  }, [search, filters, t])

  const filterConfigs: FilterConfig[] = useMemo(() => ([
    { key: 'role', label: t('common.role'), options: [
      { value: 'ADMIN', label: t('role.admin') },
      { value: 'STAFF', label: t('role.staff') },
      { value: 'CLIENT', label: t('role.client') },
    ], value: filters.role },
    { key: 'status', label: t('common.status'), options: [
      { value: 'ACTIVE', label: t('status.active') },
      { value: 'INACTIVE', label: t('status.inactive') },
      { value: 'SUSPENDED', label: 'SUSPENDED' },
    ], value: filters.status },
    { key: 'range', label: t('common.date'), options: [
      { value: '7d', label: t('range.last7d') },
      { value: '30d', label: t('range.last30d') },
    ], value: filters.range },
  ]), [filters.role, filters.status, filters.range, t])

  const columns: Column<UserRow>[] = useMemo(() => ([
    { key: 'id', label: t('common.id'), render: (v) => <span className="text-xs text-gray-500">{String(v).slice(0,6)}</span> },
    { key: 'name', label: t('common.name'), sortable: true, render: (v, r) => (
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{v || '—'}</span>
        <span className="text-xs text-gray-500">{r.email || '—'}</span>
      </div>
    ) },
    { key: 'role', label: t('common.role'), sortable: true },
    { key: 'status', label: t('common.status'), sortable: true },
    { key: 'createdAt', label: t('common.created'), sortable: true, render: (v) => v ? new Date(v as any).toLocaleString() : '—' },
  ]), [t])

  const setRoleBulk = async () => {
    if (!selectedIds.length) return
    setSelectedBulkRole(null)
    setIsRoleModalOpen(true)
  }

  const applyRoleBulk = async () => {
    if (!selectedIds.length || !selectedBulkRole) return
    const next = selectedBulkRole.toUpperCase()
    if (!hasRole(next, ['ADMIN', 'STAFF', 'CLIENT'])) return
    for (const id of selectedIds) {
      await apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: next }) })
    }
    setSelectedIds([])
    setIsRoleModalOpen(false)
    await mutate()
  }

  const setStatusBulk = async () => {
    if (!selectedIds.length) return
    setSelectedBulkStatus(null)
    setIsStatusModalOpen(true)
  }

  const applyStatusBulk = async () => {
    if (!selectedIds.length || !selectedBulkStatus) return
    const next = selectedBulkStatus.toUpperCase()
    if (!next || !['ACTIVE','INACTIVE','SUSPENDED'].includes(next)) return
    for (const id of selectedIds) {
      await apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
    }
    setSelectedIds([])
    setIsStatusModalOpen(false)
    await mutate()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.clients.title')}</h2>
        <Link href="/admin/clients/new" className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">{t('dashboard.clients.new')}</Link>
      </div>

      {/* A11y live region for SR updates */}
      <div aria-live="polite" className="sr-only">
        {selectedIds.length > 0 ? t('dashboard.selectedCount', { count: selectedIds.length }) : t('dashboard.noSelection')}
        {active.length ? ` • ${t('dashboard.filtersActiveCount', { count: active.length })}` : ''}
      </div>

      <FilterBar
        filters={filterConfigs}
        onFilterChange={onFilterChange}
        onSearch={(v) => setSearch(v)}
        active={active}
        searchPlaceholder={t('dashboard.search.clients')}
      />

      <AdvancedDataTable<UserRow>
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
            <button onClick={setRoleBulk} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">{t('dashboard.setRole')}</button>
            <button onClick={setStatusBulk} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">{t('dashboard.setStatus')}</button>
            <button onClick={() => setSelectedIds([])} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50">{t('dashboard.clear')}</button>
          </div>
        </div>
      )}

      {/* Role modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dashboard.setRole')}</DialogTitle>
            <DialogDescription>{t('dashboard.setRoleConfirm', { count: selectedIds.length })}</DialogDescription>
          </DialogHeader>

          <div className="p-4">
            <Select value={selectedBulkRole || undefined} onValueChange={(v) => setSelectedBulkRole(v || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('common.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="CLIENT">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={applyRoleBulk} disabled={!selectedBulkRole}>{t('common.apply')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
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
