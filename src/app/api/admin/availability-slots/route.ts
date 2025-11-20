import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext, getTenantFilter } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'
import { publishSlotCreated, publishSlotUpdated, publishSlotDeleted } from '@/lib/realtime/availability-events'
import { format } from 'date-fns'

export const runtime = 'nodejs'

const CreateSchema = z.object({
  serviceId: z.string().min(1),
  teamMemberId: z.string().nullable().optional(),
  date: z.string().min(1), // yyyy-mm-dd
  startTime: z.string().min(1), // HH:mm
  endTime: z.string().min(1), // HH:mm
  available: z.boolean().default(true),
  reason: z.string().optional(),
  maxBookings: z.number().int().min(0).optional(),
})

const UpdateSchema = CreateSchema.extend({ id: z.string().min(1) })

export const GET = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role as string | undefined
  if (!ctx || !ctx.userId || !hasPermission(role, PERMISSIONS.TEAM_VIEW)) {
    return respond.unauthorized()
  }

  const tenantId = ctx.tenantId

  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId') || undefined
    const teamMemberId = searchParams.get('teamMemberId') || undefined
    const date = searchParams.get('date')

    const where: any = { ...(isMultiTenancyEnabled() && tenantId ? tenantFilter(tenantId) : {}) }
    if (serviceId) where.serviceId = serviceId
    if (teamMemberId) where.teamMemberId = teamMemberId
    if (date) {
      // match specific date
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      const dEnd = new Date(d);
      dEnd.setHours(23,59,59,999)
      where.date = { gte: d, lte: dEnd }
    }

    const rows = await prisma.availabilitySlot.findMany({ where, orderBy: { date: 'asc' } })
    return NextResponse.json({ availabilitySlots: rows })
  } catch (e: any) {
    console.error('admin/availability-slots GET error', e)
    return NextResponse.json({ error: 'Failed to load availability slots' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role as string | undefined
  if (!ctx || !ctx.userId || !hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
    return respond.unauthorized()
  }

  const tenantId = ctx.tenantId

  const body = await request.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.issues }, { status: 400 })

  try {
    const slotDate = new Date(parsed.data.date)
    const data: any = {
      serviceId: parsed.data.serviceId,
      teamMemberId: parsed.data.teamMemberId || null,
      date: slotDate,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      available: parsed.data.available ?? true,
      reason: parsed.data.reason || null,
      maxBookings: parsed.data.maxBookings ?? 1,
    }
    if (isMultiTenancyEnabled() && tenantId) data.tenantId = tenantId

    const created = await prisma.availabilitySlot.create({ data })

    // Publish real-time event for portal and admin notifications
    publishSlotCreated(
      parsed.data.serviceId,
      format(slotDate, 'yyyy-MM-dd'),
      parsed.data.teamMemberId
    )

    return NextResponse.json({ availabilitySlot: created }, { status: 201 })
  } catch (e: any) {
    console.error('admin/availability-slots POST error', e)
    return NextResponse.json({ error: 'Failed to create availability slot' }, { status: 500 })
  }
})

export const PUT = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role as string | undefined
  if (!ctx || !ctx.userId || !hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
    return respond.unauthorized()
  }

  const tenantId = ctx.tenantId

  const body = await request.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', details: parsed.error.issues }, { status: 400 })

  try {
    const slotDate = new Date(parsed.data.date)
    const updateData: any = {
      serviceId: parsed.data.serviceId,
      teamMemberId: parsed.data.teamMemberId || null,
      date: slotDate,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      available: parsed.data.available ?? true,
      reason: parsed.data.reason || null,
      maxBookings: parsed.data.maxBookings ?? 1,
    }
    const where: any = { id: parsed.data.id }
    if (isMultiTenancyEnabled() && tenantId) Object.assign(where, tenantFilter(tenantId))

    const updated = await prisma.availabilitySlot.update({ where, data: updateData })

    // Publish real-time event for portal and admin notifications
    publishSlotUpdated(
      parsed.data.serviceId,
      format(slotDate, 'yyyy-MM-dd'),
      parsed.data.teamMemberId
    )

    return NextResponse.json({ availabilitySlot: updated })
  } catch (e: any) {
    console.error('admin/availability-slots PUT error', e)
    return NextResponse.json({ error: 'Failed to update availability slot' }, { status: 500 })
  }
})

export const DELETE = withTenantContext(async (request: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role as string | undefined
  if (!ctx || !ctx.userId || !hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
    return respond.unauthorized()
  }

  const tenantId = ctx.tenantId

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const where: any = { id }
    if (isMultiTenancyEnabled() && tenantId) Object.assign(where, tenantFilter(tenantId))

    // Get slot details before deletion for event publishing
    const slot = await prisma.availabilitySlot.findFirst({ where })

    await prisma.availabilitySlot.delete({ where })

    // Publish real-time event for portal and admin notifications
    if (slot) {
      publishSlotDeleted(
        slot.serviceId,
        format(slot.date, 'yyyy-MM-dd'),
        slot.teamMemberId || undefined
      )
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('admin/availability-slots DELETE error', e)
    return NextResponse.json({ error: 'Failed to delete availability slot' }, { status: 500 })
  }
})
