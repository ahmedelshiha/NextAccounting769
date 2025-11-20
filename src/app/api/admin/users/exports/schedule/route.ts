import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { tenantContext } from '@/lib/tenant-context'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { rateLimitAsync } from '@/lib/rate-limit'

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const allowed = await rateLimitAsync(identifier)
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const context = tenantContext.getContext()
    const hasAccess = await hasPermission(context.userId, PERMISSIONS.USERS_EXPORT)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const whereClause: any = {}
    if (context.tenantId) {
      whereClause.tenantId = context.tenantId
    }

    const schedules = await prisma.exportSchedule.findMany({
      where: whereClause,
      include: { _count: { select: { executions: true } } },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      schedules: schedules.map(s => ({
        ...s,
        executionCount: s._count.executions
      }))
    })
  } catch (error) {
    console.error('Failed to fetch export schedules:', error)
    return NextResponse.json({ error: 'Failed to fetch export schedules' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const allowed = await rateLimitAsync(identifier)
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const context = tenantContext.getContext()

    if (!context.tenantId) {
      return NextResponse.json({ error: 'Tenant context is required' }, { status: 400 })
    }

    if (!context.userId) {
      return NextResponse.json({ error: 'User context is required' }, { status: 400 })
    }

    const hasAccess = await hasPermission(context.userId, PERMISSIONS.USERS_EXPORT)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, frequency, format, recipients, dayOfWeek, dayOfMonth, time, emailSubject, emailBody, filterPresetId, isActive = true } = body

    if (!name || !frequency || !format || !recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'Missing required fields: name, frequency, format, recipients' }, { status: 400 })
    }

    if (!['csv', 'xlsx', 'json', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Invalid export format' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (recipients.some((email: string) => !emailRegex.test(email))) {
      return NextResponse.json({ error: 'One or more recipient emails are invalid' }, { status: 400 })
    }

    const existingSchedules = await prisma.exportSchedule.count({ where: { tenantId: context.tenantId } })
    if (existingSchedules >= 20) {
      return NextResponse.json({ error: 'Maximum number of export schedules (20) reached for this tenant' }, { status: 400 })
    }

    const schedule = await prisma.exportSchedule.create({
      data: {
        id: crypto.randomUUID(),
        name,
        description,
        frequency,
        format,
        recipients,
        dayOfWeek: dayOfWeek || null,
        dayOfMonth: dayOfMonth || null,
        time: time || '09:00',
        emailSubject,
        emailBody,
        filterPresetId: filterPresetId || null,
        isActive,
        tenantId: context.tenantId,
        userId: context.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, schedule, message: 'Export schedule created successfully' })
  } catch (error) {
    console.error('Failed to create export schedule:', error)
    return NextResponse.json({ error: 'Failed to create export schedule' }, { status: 500 })
  }
})

export const PATCH = withTenantContext(async (request: NextRequest) => {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const allowed = await rateLimitAsync(identifier)
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const context = tenantContext.getContext()
    const hasAccess = await hasPermission(context.userId, PERMISSIONS.USERS_EXPORT)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, scheduleIds } = body

    if (action === 'toggleActive' && scheduleIds && Array.isArray(scheduleIds)) {
      await prisma.exportSchedule.updateMany({
        where: { id: { in: scheduleIds } },
        data: { isActive: false }
      })
      return NextResponse.json({ success: true, message: 'Schedules updated' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update export schedules:', error)
    return NextResponse.json({ error: 'Failed to update export schedules' }, { status: 500 })
  }
})

export const DELETE = withTenantContext(async (request: NextRequest) => {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const allowed = await rateLimitAsync(identifier)
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const context = tenantContext.getContext()
    const hasAccess = await hasPermission(context.userId, PERMISSIONS.USERS_EXPORT)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',') || []

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No schedule IDs provided' }, { status: 400 })
    }

    await prisma.exportScheduleExecution.deleteMany({ where: { scheduleId: { in: ids } } })
    const deleted = await prisma.exportSchedule.deleteMany({ where: { id: { in: ids } } })

    return NextResponse.json({ success: true, deletedCount: deleted.count, message: `${deleted.count} schedule(s) deleted` })
  } catch (error) {
    console.error('Failed to delete export schedules:', error)
    return NextResponse.json({ error: 'Failed to delete export schedules' }, { status: 500 })
  }
})
