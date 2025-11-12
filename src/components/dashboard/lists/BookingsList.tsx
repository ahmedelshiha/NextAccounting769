"use client"

'use client'

import React, { useMemo, useState } from 'react'
import { useBookings, type BookingsQuery } from '@/hooks/useBookings'
import FilterBar from '@/components/dashboard/FilterBar'
import AdvancedDataTable from '@/components/dashboard/tables/AdvancedDataTable'
import type { Column, FilterConfig, RowAction } from '@/types/dashboard'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SRItem {
  id: string
  clientName?: string | null
  client?: { name?: string | null; email?: string | null } | null
  service?: { name?: string | null; price?: unknown } | null
  status?: string | null
  priority?: string | null
  bookingType?: string | null
  scheduledAt?: string | Date | null
  paymentStatus?: 'UNPAID'|'INTENT'|'PAID'|'FAILED'|'REFUNDED' | null
  paymentAmountCents?: number | null
}

const toNumberish = (v: unknown): number => {
  if (v == null) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'bigint') return Number(v)
  if (typeof v === 'string') { const n = Number(v); return Number.isFinite(n) ? n : 0 }
  try {
    const s = (v as any)?.toString?.()
    if (typeof s === 'string') { const n = Number(s); return Number.isFinite(n) ? n : 0 }
  } catch {}
  return 0
}

export default function BookingsList() {
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<{
    status?: string
    priority?: string
    bookingType?: string
    paymentStatus?: string
  }>({})
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([])
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assigneeId, setAssigneeId] = useState<string | null>(null)

  const params: BookingsQuery = {
    scope: 'admin',
    q,
    status: filters.status || 'ALL',
    priority: filters.priority || 'ALL',
    bookingType: filters.bookingType as any || 'ALL',
    paymentStatus: filters.paymentStatus as any || 'ALL',
    page: 1,
    limit: 20,
  }

  const { items, isLoading, refresh } = useBookings(params)

  const onFilterChange = (key: string, value: string) => {
    setFilters((p) => ({ ...p, [key]: value || undefined }))
  }

  const active = useMemo(() => {
    const a: Array<{ key: string; label: string; value: string }> = []
    if (q) a.push({ key: 'q', label: 'Search', value: q })
    if (filters.status) a.push({ key: 'status', label: 'Status', value: filters.status })
    if (filters.priority) a.push({ key: 'priority', label: 'Priority', value: filters.priority })
    if (filters.bookingType) a.push({ key: 'bookingType', label: 'Type', value: filters.bookingType })
    if (filters.paymentStatus) a.push({ key: 'paymentStatus', label: 'Payment', value: filters.paymentStatus })
    return a
  }, [q, filters])

  const filterConfigs: FilterConfig[] = [
    { key: 'status', label: 'Status', options: [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'SUBMITTED', label: 'Submitted' },
      { value: 'IN_REVIEW', label: 'In Review' },
      { value: 'APPROVED', label: 'Approved' },
      { value: 'ASSIGNED', label: 'Assigned' },
      { value: 'IN_PROGRESS', label: 'In Progress' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'CANCELLED', label: 'Cancelled' },
    ], value: filters.status },
    { key: 'priority', label: 'Priority', options: [
      { value: 'LOW', label: 'Low' },
      { value: 'MEDIUM', label: 'Medium' },
      { value: 'HIGH', label: 'High' },
      { value: 'URGENT', label: 'Urgent' },
    ], value: filters.priority },
    { key: 'bookingType', label: 'Type', options: [
      { value: 'STANDARD', label: 'Standard' },
      { value: 'RECURRING', label: 'Recurring' },
      { value: 'EMERGENCY', label: 'Emergency' },
      { value: 'CONSULTATION', label: 'Consultation' },
    ], value: filters.bookingType },
    { key: 'paymentStatus', label: 'Payment', options: [
      { value: 'UNPAID', label: 'Unpaid' },
      { value: 'INTENT', label: 'Intent' },
      { value: 'PAID', label: 'Paid' },
      { value: 'FAILED', label: 'Failed' },
      { value: 'REFUNDED', label: 'Refunded' },
    ], value: filters.paymentStatus },
  ]

  const columns: Column<SRItem>[] = [
    { key: 'id', label: 'ID', render: (v) => <span className="text-xs text-gray-500">{String(v).slice(0,6)}</span> },
    { key: 'clientName', label: 'Client', sortable: true, render: (_, r) => (
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{r.clientName || r.client?.name || '—'}</span>
        <span className="text-xs text-gray-500">{r.client?.email || '—'}</span>
      </div>
    ) },
    { key: 'service', label: 'Service', render: (v) => (
      <div className="flex flex-col">
        <span>{(v?.name as string) || '—'}</span>
      </div>
    ) },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'paymentStatus', label: 'Payment', render: (v, r) => {
      const cents = (r as any).paymentAmountCents ?? null
      const fromSvc = toNumberish((r.service as any)?.price) * 100
      const amount = cents != null ? cents : (fromSvc || 0)
      return <span className="whitespace-nowrap">{v || '—'}{amount ? ` • $${(amount/100).toFixed(2)}` : ''}</span>
    } },
    { key: 'scheduledAt', label: 'Date', sortable: true, render: (v, r) => (
      <span>{v ? new Date(v as any).toLocaleString() : (r as any).createdAt ? new Date((r as any).createdAt).toLocaleString() : '—'}</span>
    ) },
  ]

  const actions: RowAction<SRItem>[] = [
    { label: 'Open', onClick: (row) => { window.location.href = `/admin/service-requests/${row.id}` } },
  ]

  const [sortBy, setSortBy] = useState<string | undefined>('scheduledAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sorted = useMemo(() => {
    const arr = [...(items as SRItem[])]
    if (!sortBy) return arr
    arr.sort((a, b) => {
      const av = (a as any)[sortBy]
      const bv = (b as any)[sortBy]
      if (sortBy === 'scheduledAt') {
        const ad = av ? new Date(av as any).getTime() : new Date((a as any).createdAt || 0).getTime()
        const bd = bv ? new Date(bv as any).getTime() : new Date((b as any).createdAt || 0).getTime()
        return (ad - bd) * (sortOrder === 'asc' ? 1 : -1)
      }
      const ax = av == null ? '' : String(av)
      const bx = bv == null ? '' : String(bv)
      return ax.localeCompare(bx) * (sortOrder === 'asc' ? 1 : -1)
    })
    return arr
  }, [items, sortBy, sortOrder])

  const exportCsv = async () => {
    const qs = new URLSearchParams()
    if (q) qs.set('q', q)
    if (filters.status) qs.set('status', filters.status)
    if (filters.priority) qs.set('priority', filters.priority)
    if (filters.bookingType) qs.set('bookingType', filters.bookingType)
    if (filters.paymentStatus) qs.set('paymentStatus', filters.paymentStatus)
    const res = await fetch(`/api/admin/service-requests/export?${qs.toString()}`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `service-requests-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const cancelSelected = async () => {
    if (!selectedIds.length) return
    await fetch('/api/admin/service-requests/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', ids: selectedIds, status: 'CANCELLED' }),
    })
    setSelectedIds([])
    await refresh()
  }

  const assignSelected = async () => {
    if (!selectedIds.length) return
    setAssigneeId(null)
    setIsAssignModalOpen(true)
  }

  const applyAssignSelected = async () => {
    if (!selectedIds.length || !assigneeId) return
    for (const id of selectedIds) {
      await fetch(`/api/admin/service-requests/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamMemberId: assigneeId }),
      }).catch(() => {})
    }
    setSelectedIds([])
    setIsAssignModalOpen(false)
    await refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Service Requests & Appointments</h2>
        <Link href="/admin/service-requests/new" className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">New</Link>
      </div>
      <FilterBar
        filters={filterConfigs}
        onFilterChange={onFilterChange}
        onSearch={(v) => setQ(v)}
        active={active}
        searchPlaceholder="Search clients, services…"
      />
      <AdvancedDataTable
        columns={columns}
        rows={sorted}
        loading={isLoading}
        onSort={(key) => {
          if (sortBy === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
          setSortBy(key)
        }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        actions={actions}
        selectable
        onSelectionChange={(ids) => setSelectedIds(ids)}
      />
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-sm text-gray-700">{selectedIds.length} selected</div>
          <div className="flex items-center gap-2">
            <button onClick={exportCsv} className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50">Export CSV</button>
            <button onClick={cancelSelected} className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50">Cancel</button>
            <button onClick={assignSelected} className="px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50">Assign</button>
            <button onClick={() => setSelectedIds([])} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50">Clear</button>
          </div>
        </div>
      )}

      {/* Assign modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign to team member</DialogTitle>
            <DialogDescription>Enter the team member ID to assign selected bookings</DialogDescription>
          </DialogHeader>

          <div className="p-4">
            <Input value={assigneeId ?? ''} onChange={(e) => setAssigneeId(e.target.value)} placeholder="Team member ID" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={applyAssignSelected} disabled={!assigneeId}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
