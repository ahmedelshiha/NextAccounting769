import { Metadata } from 'next'
import { authOptions, getSessionOrBypass } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminOverview from '@/components/admin/dashboard/AdminOverview'
import { hasRole } from '@/lib/permissions'

export const metadata: Metadata = {
  title: 'Admin Dashboard Overview',
  description: 'Professional admin overview with live KPIs and analytics',
}

export default async function AdminOverviewPage() {
  const session = await getSessionOrBypass()
  if (!session?.user) redirect('/login')

  const role = (session.user as any)?.role as string | undefined
  if (role === 'CLIENT') redirect('/portal')
  if (!hasRole(role || '', ['ADMIN', 'TEAM_LEAD', 'SUPER_ADMIN', 'STAFF'])) redirect('/admin/analytics')

  // Hydrate initial KPI data server-side for faster first paint (do not throw on failures)
  let bookingsJson: any = null
  let servicesJson: any = null
  let usersJson: any = null
  try {
    const [bookingsRes, servicesRes, usersRes] = await Promise.all([
      fetch('/api/admin/bookings/stats', { cache: 'no-store' }).catch(() => new Response(null, { status: 503 })),
      fetch('/api/admin/services/stats?range=90d', { cache: 'no-store' }).catch(() => new Response(null, { status: 503 })),
      fetch('/api/admin/stats/users?range=90d', { cache: 'no-store' }).catch(() => new Response(null, { status: 503 }))
    ])

    const [b, s, u] = await Promise.all([
      bookingsRes.ok ? bookingsRes.json().catch(() => null) : null,
      servicesRes.ok ? servicesRes.json().catch(() => null) : null,
      usersRes.ok ? usersRes.json().catch(() => null) : null
    ])
    bookingsJson = b
    servicesJson = s
    usersJson = u
  } catch {
    // swallow to keep server render resilient
  }

  return (
    <AdminOverview
      initial={{
        bookingsStats: bookingsJson ?? undefined,
        servicesStats: servicesJson ?? undefined,
        usersStats: usersJson ?? undefined,
      }}
    />
  )
}
