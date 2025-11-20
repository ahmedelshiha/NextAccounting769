import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { tenantContext } from '@/lib/tenant-context'
import { hasPermission } from '@/lib/permissions'
import { rateLimitAsync } from '@/lib/rate-limit'

export const GET = withTenantContext(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const success = await rateLimitAsync(identifier)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const context = tenantContext.getContext()
    const hasAccess = await hasPermission(context.userId, 'reports.read')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        creator: { select: { name: true, email: true } },
        executions: { orderBy: { executedAt: 'desc' }, take: 10 }
      }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error('Failed to fetch report:', error)
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
})

export const PATCH = withTenantContext(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const success = await rateLimitAsync(identifier)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const context = tenantContext.getContext()
    const hasAccess = await hasPermission(context.userId, 'reports.write')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existingReport = await prisma.report.findUnique({ where: { id: params.id } })
    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, format, sections, pageSize, orientation, includeHeader, includeFooter, headerText, footerText } = body

    const updatedReport = await prisma.report.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(format && { format }),
        ...(sections && { sections }),
        ...(pageSize && { pageSize }),
        ...(orientation && { orientation }),
        ...(includeHeader !== undefined && { includeHeader }),
        ...(includeFooter !== undefined && { includeFooter }),
        ...(headerText !== undefined && { headerText }),
        ...(footerText !== undefined && { footerText }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, report: updatedReport, message: 'Report updated successfully' })
  } catch (error) {
    console.error('Failed to update report:', error)
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
  }
})

export const DELETE = withTenantContext(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const success = await rateLimitAsync(identifier)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const context = tenantContext.getContext()
    const hasAccess = await hasPermission(context.userId, 'reports.delete')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.reportExecution.deleteMany({ where: { reportId: params.id } })
    const deleted = await prisma.report.delete({ where: { id: params.id } })

    if (!deleted) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Report deleted successfully' })
  } catch (error) {
    console.error('Failed to delete report:', error)
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
  }
})
