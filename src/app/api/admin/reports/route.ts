import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { tenantContext } from '@/lib/tenant-context'
import { hasPermission } from '@/lib/permissions'
import { rateLimitAsync } from '@/lib/rate-limit'

/**
 * GET /api/admin/reports
 * List all reports for the current user/tenant
 */
export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const success = await rateLimitAsync(identifier)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const context = tenantContext.getContext()

    if (!context.tenantId) {
      return NextResponse.json({ error: 'Tenant context is required' }, { status: 400 })
    }

    const hasAccess = await hasPermission(context.userId, 'reports.read')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''

    const where: any = { tenantId: context.tenantId }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const totalCount = await prisma.report.count({ where })
    const reports = await prisma.report.findMany({
      where,
      include: {
        creator: { select: { name: true, email: true } },
        _count: { select: { executions: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset
    })

    return NextResponse.json({
      success: true,
      reports: reports.map(r => ({
        ...r,
        executionCount: r._count.executions
      })),
      totalCount,
      limit,
      offset
    })
  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
})

/**
 * POST /api/admin/reports
 * Create a new report
 */
export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const success = await rateLimitAsync(identifier)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const context = tenantContext.getContext()

    if (!context.tenantId) {
      return NextResponse.json({ error: 'Tenant context is required' }, { status: 400 })
    }

    if (!context.userId) {
      return NextResponse.json({ error: 'User context is required' }, { status: 400 })
    }

    const hasAccess = await hasPermission(context.userId, 'reports.write')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, format, sections, pageSize, orientation, includeHeader, includeFooter, headerText, footerText, templateId } = body

    if (!name) {
      return NextResponse.json({ error: 'Report name is required' }, { status: 400 })
    }

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'Report sections are required' }, { status: 400 })
    }

    const reportData: any = {
      id: crypto.randomUUID(),
      name,
      description: description || null,
      format: format || 'table',
      sections: sections || [],
      pageSize: pageSize || 'A4',
      orientation: orientation || 'portrait',
      includeHeader: includeHeader ?? true,
      includeFooter: includeFooter ?? true,
      headerText: headerText || null,
      footerText: footerText || null,
      templateId: templateId || null,
      tenantId: context.tenantId,
      userId: context.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const report = await prisma.report.create({
      data: reportData
    })

    return NextResponse.json({ success: true, report, message: 'Report created successfully' })
  } catch (error) {
    console.error('Failed to create report:', error)
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
})
