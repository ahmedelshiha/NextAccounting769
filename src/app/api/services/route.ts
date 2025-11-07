import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { withTenantContext } from '@/lib/api-wrapper'
import { tenantContext } from '@/lib/tenant-context'
import { requireTenantContext } from '@/lib/tenant-utils'
import { getTenantFromRequest, tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'
import { hasRole } from '@/lib/permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/services - Get all active services (public, tenant-aware)
export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    // Early fallback to avoid noisy errors when DB is not configured in dev
    if (!process.env.NETLIFY_DATABASE_URL) {
      const fallback = [
        { id: '1', name: 'Bookkeeping', slug: 'bookkeeping', shortDesc: 'Monthly bookkeeping and reconciliations', price: 299, featured: true },
        { id: '2', name: 'Tax Preparation', slug: 'tax-preparation', shortDesc: 'Personal and business tax filings', price: 450, featured: true },
        { id: '3', name: 'Payroll Management', slug: 'payroll', shortDesc: 'Payroll processing and compliance', price: 199, featured: true },
        { id: '4', name: 'CFO Advisory Services', slug: 'cfo-advisory', shortDesc: 'Strategic financial guidance', price: 1200, featured: true },
      ]
      return NextResponse.json(fallback)
    }

    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    const category = searchParams.get('category')

    // Use tenant context when available; otherwise derive hint from request
    const ctxTenant = tenantContext.getContextOrNull()?.tenantId ?? null
    const tenantId = ctxTenant || getTenantFromRequest(request as any)

    // Guard the import and DB call to avoid long blocking if Prisma/DB is cold or unreachable
    const timeoutMs = Number(process.env.SERVICES_QUERY_TIMEOUT_MS ?? 2500)
    let prisma: any = null
    try {
      const importPromise = import('@/lib/prisma')
      const imported = await Promise.race([
        importPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Prisma import timeout')), Math.max(250, timeoutMs)))
      ])
      prisma = (imported as any).default
    } catch (e) {
      console.error('Prisma import failed or timed out, falling back to static services list:', e)
      const fallback = [
        { id: '1', name: 'Bookkeeping', slug: 'bookkeeping', shortDesc: 'Monthly bookkeeping and reconciliations', price: 299, featured: true },
        { id: '2', name: 'Tax Preparation', slug: 'tax-preparation', shortDesc: 'Personal and business tax filings', price: 450, featured: true },
        { id: '3', name: 'Payroll Management', slug: 'payroll', shortDesc: 'Payroll processing and compliance', price: 199, featured: true },
        { id: '4', name: 'CFO Advisory Services', slug: 'cfo-advisory', shortDesc: 'Strategic financial guidance', price: 1200, featured: true },
      ]
      return NextResponse.json(fallback)
    }

    const where: Prisma.ServiceWhereInput = { active: true, ...(tenantFilter(tenantId) as any) }

    if (featured === 'true') {
      where.featured = true
    }

    if (category) {
      where.category = category
    }

    // Add a timeout guard to avoid hanging requests when DB is cold or unreachable
    const findPromise = prisma.service.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    const services = await Promise.race<Awaited<ReturnType<typeof prisma.service.findMany>>>([
      findPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Service query timeout')), Math.max(250, timeoutMs))) as Promise<never>,
    ]).catch(() => null as any)

    if (!services || services.length === 0) {
      const fallback = [
        { id: '1', name: 'Bookkeeping', slug: 'bookkeeping', shortDesc: 'Monthly bookkeeping and reconciliations', price: 299, featured: true },
        { id: '2', name: 'Tax Preparation', slug: 'tax-preparation', shortDesc: 'Personal and business tax filings', price: 450, featured: true },
        { id: '3', name: 'Payroll Management', slug: 'payroll', shortDesc: 'Payroll processing and compliance', price: 199, featured: true },
        { id: '4', name: 'CFO Advisory Services', slug: 'cfo-advisory', shortDesc: 'Strategic financial guidance', price: 1200, featured: true },
      ]
      return NextResponse.json(fallback)
    }

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    // graceful fallback on runtime errors
    const fallback = [
      { id: '1', name: 'Bookkeeping', slug: 'bookkeeping', shortDesc: 'Monthly bookkeeping and reconciliations', price: 299, featured: true },
      { id: '2', name: 'Tax Preparation', slug: 'tax-preparation', shortDesc: 'Personal and business tax filings', price: 450, featured: true },
      { id: '3', name: 'Payroll Management', slug: 'payroll', shortDesc: 'Strategic financial guidance', price: 199, featured: true },
      { id: '4', name: 'CFO Advisory Services', slug: 'cfo-advisory', shortDesc: 'Strategic financial guidance', price: 1200, featured: true },
    ]
    return NextResponse.json(fallback)
  }
}, { requireAuth: false })

// POST /api/services - Create a new service (admin only); delegate to admin/services
export const POST = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? ''
  if (!hasRole(role, ['ADMIN', 'OWNER', 'TEAM_LEAD'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Delegate to the canonical admin endpoint to centralize validation and audit
    const mod = await import('@/app/api/admin/services/route')
    const res: Response = await mod.POST(request as any, {} as any)
    // Pass-through response (status/body)
    const body = await res.json().catch(() => null)
    return NextResponse.json(body, { status: res.status })
  } catch (error) {
    console.error('Error creating service via delegation:', error)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
})
