import { getSessionOrBypass } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { hasRole } from '@/lib/permissions'
import ListPage from '@/components/dashboard/templates/ListPage'
import type { Column, RowAction, TabItem, FilterConfig } from '@/types/dashboard'

interface Row { id: number; name: string; status: string; amount: number }

export default async function ListPagePreview() {
  const columns: Column<Row>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, align: 'right', render: (v) => `$${Number(v).toFixed(2)}` },
  ]
  const rows: Row[] = [
    { id: 1, name: 'Item A', status: 'Open', amount: 1250 },
    { id: 2, name: 'Item B', status: 'Closed', amount: 320 },
    { id: 3, name: 'Item C', status: 'Open', amount: 780 },
    { id: 4, name: 'Item D', status: 'Open', amount: 90 },
  ]
  const actions: RowAction<Row>[] = [
    { label: 'View', onClick: (r) => alert(`View ${r.name}`) },
    { label: 'Delete', variant: 'destructive', onClick: (r) => alert(`Delete ${r.name}`) },
  ]
  const filters: FilterConfig[] = [
    { key: 'status', label: 'Status', options: [
      { value: 'all', label: 'All' },
      { value: 'Open', label: 'Open' },
      { value: 'Closed', label: 'Closed' },
    ], value: 'all' }
  ]
  const primaryTabs: TabItem[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
  ]

  const enabled = process.env.NEXT_PUBLIC_ENABLE_ADMIN_PREVIEWS === 'true' || process.env.NODE_ENV !== 'production'
  if (!enabled) {
    return <div className="p-6 text-sm text-gray-600">Previews are disabled in production.</div>
  }
  const session = await getSessionOrBypass()
  if (!session?.user) { redirect('/login') }
  const role = (session.user as any)?.role as string | undefined
  if (!hasRole(role || '', ['ADMIN', 'TEAM_LEAD', 'SUPER_ADMIN', 'STAFF'])) { redirect('/admin') }
  return (
    <ListPage<Row>
      title="List Template Preview"
      subtitle="Demonstrates DataTable/AdvancedDataTable integration"
      primaryAction={{ label: 'New', onClick: () => alert('New') }}
      primaryTabs={primaryTabs}
      activePrimaryTab={'all'}
      onPrimaryTabChange={(k) => console.log('tab', k)}
      filters={filters}
      onFilterChange={(k, v) => console.log('filter', k, v)}
      onSearch={(q) => console.log('search', q)}
      columns={columns}
      rows={rows}
      actions={actions}
      useAdvancedTable
      pageSize={2}
    />
  )
}
